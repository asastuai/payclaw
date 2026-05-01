// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import { AgentWallet } from "../src/AgentWallet.sol";
import { AgentWalletFactory } from "../src/AgentWalletFactory.sol";
import { PolicyRegistry } from "../src/PolicyRegistry.sol";
import { ApprovalQueue } from "../src/ApprovalQueue.sol";
import { PoCVerifier } from "../src/PoCVerifier.sol";
import { IPolicyRegistry } from "../src/interfaces/IPolicyRegistry.sol";
import { IApprovalQueue } from "../src/interfaces/IApprovalQueue.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";

/// @notice End-to-end Phase 7c tests: AgentWallet routes pay/swap/batchPay/approveRequest through
///         PolicyRegistry.checkTransactionWithPoC. Wallets that did not opt in to PoC enforcement
///         see no behavioral change. Wallets that did must use the WithPoC overloads.
contract AgentWalletPoCTest is Test {
    PolicyRegistry internal registry;
    ApprovalQueue internal queue;
    AgentWalletFactory internal factory;
    PoCVerifier internal verifier;
    MockERC20 internal usdc;

    address internal verifierOwner = address(0xD1);
    address internal operator = address(0xD2);
    address internal walletOwner = address(0xA1);
    address internal agent = address(0xA2);
    address internal recipient = address(0xB1);

    AgentWallet internal wallet;

    bytes32 internal goodCommit = keccak256("fresh poc commitment");
    bytes32 internal unknownCommit = keccak256("never submitted");

    function setUp() public {
        registry = new PolicyRegistry();
        queue = new ApprovalQueue();
        factory = new AgentWalletFactory(address(registry), address(queue));
        usdc = new MockERC20("USD Coin", "USDC", 6);

        // PoC infrastructure.
        vm.prank(verifierOwner);
        verifier = new PoCVerifier(verifierOwner);
        vm.prank(verifierOwner);
        verifier.approveOperator(operator);
        vm.prank(operator);
        verifier.submitVerifiedCommitment(goodCommit, 60);

        // Wallet with generous policy.
        address[] memory tokens = new address[](1);
        tokens[0] = address(usdc);
        address[] memory empty = new address[](0);

        IPolicyRegistry.Policy memory policy = IPolicyRegistry.Policy({
            dailyLimit: 10_000e6,
            perTxLimit: 1_000e6,
            approvalThreshold: 5_000e6,
            tokenAllowlist: tokens,
            recipientAllowlist: empty,
            swapsEnabled: true,
            allowedRouters: empty,
            cooldownSeconds: 0
        });

        address walletAddr = factory.createWallet(walletOwner, agent, policy, bytes32(0));
        wallet = AgentWallet(payable(walletAddr));
        usdc.mint(address(wallet), 10_000e6);
    }

    function _enablePocOnWallet() internal {
        registry.setPocVerifier(address(verifier));
        vm.prank(walletOwner);
        registry.setPocRequired(address(wallet), true);
    }

    // -------------------------------------------------------
    // pay / payWithPoC
    // -------------------------------------------------------

    function test_pay_succeeds_when_poc_not_required() public {
        // Default state: no PoC enforcement at the registry. Old pay() still works.
        vm.prank(agent);
        wallet.pay(recipient, address(usdc), 100e6, bytes32(0));
        assertEq(usdc.balanceOf(recipient), 100e6);
    }

    function test_pay_reverts_when_poc_required() public {
        _enablePocOnWallet();
        vm.prank(agent);
        vm.expectRevert(bytes("POC_STALE_OR_MISSING"));
        wallet.pay(recipient, address(usdc), 100e6, bytes32(0));
    }

    function test_payWithPoC_succeeds_with_fresh_commitment() public {
        _enablePocOnWallet();
        vm.prank(agent);
        wallet.payWithPoC(recipient, address(usdc), 100e6, bytes32(0), goodCommit);
        assertEq(usdc.balanceOf(recipient), 100e6);
    }

    function test_payWithPoC_reverts_with_stale_commitment() public {
        _enablePocOnWallet();
        vm.warp(block.timestamp + 61);
        vm.prank(agent);
        vm.expectRevert(bytes("POC_STALE_OR_MISSING"));
        wallet.payWithPoC(recipient, address(usdc), 100e6, bytes32(0), goodCommit);
    }

    function test_payWithPoC_reverts_with_unknown_commitment() public {
        _enablePocOnWallet();
        vm.prank(agent);
        vm.expectRevert(bytes("POC_STALE_OR_MISSING"));
        wallet.payWithPoC(recipient, address(usdc), 100e6, bytes32(0), unknownCommit);
    }

    function test_payWithPoC_succeeds_when_poc_not_required_even_if_zero_commit() public {
        // PoC infra entirely off — payWithPoC with bytes32(0) is just a payment.
        vm.prank(agent);
        wallet.payWithPoC(recipient, address(usdc), 100e6, bytes32(0), bytes32(0));
        assertEq(usdc.balanceOf(recipient), 100e6);
    }

    // -------------------------------------------------------
    // batchPay / batchPayWithPoC
    // -------------------------------------------------------

    function test_batchPay_reverts_when_poc_required() public {
        _enablePocOnWallet();

        address[] memory tos = new address[](2);
        tos[0] = recipient;
        tos[1] = recipient;
        address[] memory tokens = new address[](2);
        tokens[0] = address(usdc);
        tokens[1] = address(usdc);
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 50e6;
        amounts[1] = 50e6;

        vm.prank(agent);
        vm.expectRevert(bytes("AgentWallet: batch item rejected"));
        wallet.batchPay(tos, tokens, amounts);
    }

    function test_batchPayWithPoC_succeeds_with_fresh_commitment() public {
        _enablePocOnWallet();

        address[] memory tos = new address[](2);
        tos[0] = recipient;
        tos[1] = recipient;
        address[] memory tokens = new address[](2);
        tokens[0] = address(usdc);
        tokens[1] = address(usdc);
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 50e6;
        amounts[1] = 50e6;

        vm.prank(agent);
        wallet.batchPayWithPoC(tos, tokens, amounts, goodCommit);
        assertEq(usdc.balanceOf(recipient), 100e6);
    }

    // -------------------------------------------------------
    // approveRequest / approveRequestWithPoC
    // -------------------------------------------------------

    function test_approveRequest_reverts_when_poc_required() public {
        // Queue an approval request first (amount > approvalThreshold of 5_000e6 → goes to queue).
        // Use a generous amount above threshold but within perTxLimit.
        // perTxLimit=1_000e6, approvalThreshold=5_000e6 — an item above threshold also exceeds perTxLimit.
        // Update policy: bump perTxLimit so the request can be queued.
        _bumpPerTxLimit(10_000e6);

        vm.prank(agent);
        wallet.pay(recipient, address(usdc), 6_000e6, bytes32("memo"));

        // Now turn on PoC enforcement and try to approve via the legacy path.
        _enablePocOnWallet();
        vm.prank(walletOwner);
        vm.expectRevert(bytes("AgentWallet: policy check failed on approval"));
        wallet.approveRequest(1);
    }

    function test_approveRequestWithPoC_succeeds_with_fresh_commitment() public {
        _bumpPerTxLimit(10_000e6);

        vm.prank(agent);
        wallet.pay(recipient, address(usdc), 6_000e6, bytes32("memo"));

        _enablePocOnWallet();
        vm.prank(walletOwner);
        wallet.approveRequestWithPoC(1, goodCommit);
        assertEq(usdc.balanceOf(recipient), 6_000e6);
    }

    function _bumpPerTxLimit(uint256 newPerTx) internal {
        IPolicyRegistry.Policy memory p = registry.getPolicy(address(wallet));
        p.perTxLimit = newPerTx;
        vm.prank(walletOwner);
        registry.setPolicy(address(wallet), p);
    }
}
