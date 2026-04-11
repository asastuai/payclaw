// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import { AgentWallet } from "../src/AgentWallet.sol";
import { AgentWalletFactory } from "../src/AgentWalletFactory.sol";
import { PolicyRegistry } from "../src/PolicyRegistry.sol";
import { ApprovalQueue } from "../src/ApprovalQueue.sol";
import { IPolicyRegistry } from "../src/interfaces/IPolicyRegistry.sol";
import { IApprovalQueue } from "../src/interfaces/IApprovalQueue.sol";
import { IAgentWallet } from "../src/interfaces/IAgentWallet.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";

contract AgentWalletTest is Test {
    PolicyRegistry public registry;
    ApprovalQueue public queue;
    AgentWalletFactory public factory;
    MockERC20 public usdc;
    MockERC20 public dai;

    address public owner = address(0xA1);
    address public agent = address(0xA2);
    address public recipient = address(0xB1);
    address public recipient2 = address(0xB2);
    address public recipient3 = address(0xB3);
    address public nonOwner = address(0xC1);

    AgentWallet public wallet;

    function setUp() public {
        // Deploy infrastructure
        registry = new PolicyRegistry();
        queue = new ApprovalQueue();
        factory = new AgentWalletFactory(address(registry), address(queue));

        // Deploy mock tokens
        usdc = new MockERC20("USD Coin", "USDC", 6);
        dai = new MockERC20("Dai Stablecoin", "DAI", 18);

        // Create wallet with default policy via factory
        address[] memory tokenAllowlist = new address[](1);
        tokenAllowlist[0] = address(usdc);
        address[] memory recipientAllowlist = new address[](0);
        address[] memory allowedRouters = new address[](0);

        IPolicyRegistry.Policy memory policy = IPolicyRegistry.Policy({
            dailyLimit: 1000e6,
            perTxLimit: 100e6,
            approvalThreshold: 50e6,
            tokenAllowlist: tokenAllowlist,
            recipientAllowlist: recipientAllowlist,
            swapsEnabled: true,
            allowedRouters: allowedRouters,
            cooldownSeconds: 0
        });

        address walletAddr = factory.createWallet(owner, agent, policy, bytes32(0));
        wallet = AgentWallet(payable(walletAddr));

        // Fund wallet with 10,000 USDC
        usdc.mint(address(wallet), 10_000e6);
    }

    // -------------------------------------------------------
    // Helper: create a wallet with a custom policy
    // -------------------------------------------------------
    function _createWalletWithPolicy(IPolicyRegistry.Policy memory policy) internal returns (AgentWallet) {
        address walletAddr = factory.createWallet(
            owner, agent, policy, keccak256(abi.encodePacked(block.timestamp, gasleft()))
        );
        AgentWallet w = AgentWallet(payable(walletAddr));
        usdc.mint(address(w), 10_000e6);
        return w;
    }

    // -------------------------------------------------------
    // 1. test_createWallet
    // -------------------------------------------------------
    function test_createWallet() public view {
        assertEq(wallet.owner(), owner, "owner mismatch");
        assertEq(wallet.agent(), agent, "agent mismatch");
        assertTrue(wallet.isAgentActive(), "agent should be active");

        IPolicyRegistry.Policy memory p = registry.getPolicy(address(wallet));
        assertEq(p.dailyLimit, 1000e6, "dailyLimit mismatch");
        assertEq(p.perTxLimit, 100e6, "perTxLimit mismatch");
        assertEq(p.approvalThreshold, 50e6, "approvalThreshold mismatch");
        assertEq(p.tokenAllowlist.length, 1, "tokenAllowlist length");
        assertEq(p.tokenAllowlist[0], address(usdc), "tokenAllowlist[0]");
        assertEq(p.recipientAllowlist.length, 0, "recipientAllowlist length");
        assertTrue(p.swapsEnabled, "swaps should be enabled");
        assertEq(p.cooldownSeconds, 0, "cooldown should be 0");
    }

    // -------------------------------------------------------
    // 2. test_payWithinLimits
    // -------------------------------------------------------
    function test_payWithinLimits() public {
        uint256 amount = 25e6;
        uint256 recipientBefore = usdc.balanceOf(recipient);

        vm.expectEmit(true, true, false, true, address(wallet));
        emit IAgentWallet.PaymentExecuted(recipient, address(usdc), amount, bytes32("test"));

        vm.prank(agent);
        wallet.pay(recipient, address(usdc), amount, bytes32("test"));

        assertEq(usdc.balanceOf(recipient), recipientBefore + amount, "recipient balance");
        assertEq(wallet.dailySpent(), amount, "dailySpent");
    }

    // -------------------------------------------------------
    // 3. test_payExceedsPerTxLimit
    // -------------------------------------------------------
    function test_payExceedsPerTxLimit() public {
        vm.prank(agent);
        vm.expectRevert("EXCEEDS_PER_TX_LIMIT");
        wallet.pay(recipient, address(usdc), 150e6, bytes32(0));
    }

    // -------------------------------------------------------
    // 4. test_payExceedsDailyLimit
    // -------------------------------------------------------
    function test_payExceedsDailyLimit() public {
        // Use a policy with high approvalThreshold so payments don't get queued
        address[] memory tokenAllowlist = new address[](1);
        tokenAllowlist[0] = address(usdc);

        IPolicyRegistry.Policy memory policy = IPolicyRegistry.Policy({
            dailyLimit: 1000e6,
            perTxLimit: 100e6,
            approvalThreshold: 100e6, // equal to perTxLimit so nothing triggers approval
            tokenAllowlist: tokenAllowlist,
            recipientAllowlist: new address[](0),
            swapsEnabled: true,
            allowedRouters: new address[](0),
            cooldownSeconds: 0
        });

        AgentWallet w = _createWalletWithPolicy(policy);

        // Pay 90 USDC x 11 = 990 (succeeds)
        for (uint256 i = 0; i < 11; i++) {
            vm.prank(agent);
            w.pay(recipient, address(usdc), 90e6, bytes32(0));
        }

        assertEq(w.dailySpent(), 990e6, "should have spent 990");

        // 12th payment of 90 would bring total to 1080 > 1000 daily limit
        vm.prank(agent);
        vm.expectRevert("EXCEEDS_DAILY_LIMIT");
        w.pay(recipient, address(usdc), 90e6, bytes32(0));
    }

    // -------------------------------------------------------
    // 5. test_payRequiresApproval
    // -------------------------------------------------------
    function test_payRequiresApproval() public {
        // 75 USDC > approvalThreshold 50 USDC, but <= perTxLimit 100 USDC
        uint256 amount = 75e6;
        uint256 walletBefore = usdc.balanceOf(address(wallet));

        vm.prank(agent);
        wallet.pay(recipient, address(usdc), amount, bytes32("need-approval"));

        // No transfer should have happened
        assertEq(usdc.balanceOf(address(wallet)), walletBefore, "wallet balance unchanged");
        assertEq(usdc.balanceOf(recipient), 0, "recipient got nothing");

        // A pending request should exist
        assertEq(wallet.pendingRequestCount(), 1, "one pending request");
        uint256[] memory pending = queue.getPendingRequests(address(wallet));
        assertEq(pending.length, 1, "pending array length");

        IApprovalQueue.ApprovalRequest memory req = queue.getRequest(pending[0]);
        assertEq(req.wallet, address(wallet), "request wallet");
        assertEq(req.to, recipient, "request to");
        assertEq(req.token, address(usdc), "request token");
        assertEq(req.amount, amount, "request amount");
        assertEq(uint8(req.status), uint8(IApprovalQueue.RequestStatus.Pending), "request status");
    }

    // -------------------------------------------------------
    // 6. test_approveAndExecute
    // -------------------------------------------------------
    function test_approveAndExecute() public {
        uint256 amount = 75e6;

        // Agent creates a request that needs approval
        vm.prank(agent);
        wallet.pay(recipient, address(usdc), amount, bytes32("approve-me"));

        uint256[] memory pending = queue.getPendingRequests(address(wallet));
        uint256 requestId = pending[0];

        uint256 recipientBefore = usdc.balanceOf(recipient);

        // Owner approves via the wallet
        vm.prank(owner);
        wallet.approveRequest(requestId);

        // Transfer should have happened
        assertEq(usdc.balanceOf(recipient), recipientBefore + amount, "recipient received");
        assertEq(wallet.pendingRequestCount(), 0, "no pending requests");

        // Request status should be Approved
        IApprovalQueue.ApprovalRequest memory req = queue.getRequest(requestId);
        assertEq(uint8(req.status), uint8(IApprovalQueue.RequestStatus.Approved), "status approved");
    }

    // -------------------------------------------------------
    // 7. test_denyRequest
    // -------------------------------------------------------
    function test_denyRequest() public {
        uint256 amount = 75e6;
        uint256 walletBefore = usdc.balanceOf(address(wallet));

        vm.prank(agent);
        wallet.pay(recipient, address(usdc), amount, bytes32("deny-me"));

        uint256[] memory pending = queue.getPendingRequests(address(wallet));
        uint256 requestId = pending[0];

        vm.prank(owner);
        wallet.denyRequest(requestId);

        // No transfer
        assertEq(usdc.balanceOf(address(wallet)), walletBefore, "wallet balance unchanged");
        assertEq(wallet.pendingRequestCount(), 0, "no pending requests");

        IApprovalQueue.ApprovalRequest memory req = queue.getRequest(requestId);
        assertEq(uint8(req.status), uint8(IApprovalQueue.RequestStatus.Denied), "status denied");
    }

    // -------------------------------------------------------
    // 8. test_tokenNotAllowed
    // -------------------------------------------------------
    function test_tokenNotAllowed() public {
        // DAI is not in the allowlist
        dai.mint(address(wallet), 10_000e18);

        vm.prank(agent);
        vm.expectRevert("TOKEN_NOT_ALLOWED");
        wallet.pay(recipient, address(dai), 25e18, bytes32(0));
    }

    // -------------------------------------------------------
    // 9. test_recipientAllowlist
    // -------------------------------------------------------
    function test_recipientAllowlist() public {
        // Create wallet with recipient allowlist
        address[] memory tokenAllowlist = new address[](1);
        tokenAllowlist[0] = address(usdc);
        address[] memory recipientAllowlist = new address[](1);
        recipientAllowlist[0] = recipient; // only `recipient` is allowed

        IPolicyRegistry.Policy memory policy = IPolicyRegistry.Policy({
            dailyLimit: 1000e6,
            perTxLimit: 100e6,
            approvalThreshold: 100e6,
            tokenAllowlist: tokenAllowlist,
            recipientAllowlist: recipientAllowlist,
            swapsEnabled: true,
            allowedRouters: new address[](0),
            cooldownSeconds: 0
        });

        AgentWallet w = _createWalletWithPolicy(policy);

        // Pay to allowed recipient - succeeds
        vm.prank(agent);
        w.pay(recipient, address(usdc), 25e6, bytes32(0));
        assertEq(usdc.balanceOf(recipient), 25e6, "allowed recipient received");

        // Pay to non-allowed recipient - reverts
        vm.prank(agent);
        vm.expectRevert("RECIPIENT_NOT_ALLOWED");
        w.pay(recipient2, address(usdc), 25e6, bytes32(0));
    }

    // -------------------------------------------------------
    // 10. test_cooldownEnforced
    // -------------------------------------------------------
    function test_cooldownEnforced() public {
        // Create wallet with 60s cooldown
        address[] memory tokenAllowlist = new address[](1);
        tokenAllowlist[0] = address(usdc);

        IPolicyRegistry.Policy memory policy = IPolicyRegistry.Policy({
            dailyLimit: 1000e6,
            perTxLimit: 100e6,
            approvalThreshold: 100e6,
            tokenAllowlist: tokenAllowlist,
            recipientAllowlist: new address[](0),
            swapsEnabled: true,
            allowedRouters: new address[](0),
            cooldownSeconds: 60
        });

        AgentWallet w = _createWalletWithPolicy(policy);

        // Warp forward so initial cooldown check passes (lastTxTimestamp starts at 0)
        vm.warp(block.timestamp + 120);

        // First payment succeeds
        vm.prank(agent);
        w.pay(recipient, address(usdc), 25e6, bytes32(0));

        // Immediate second payment fails due to cooldown
        vm.prank(agent);
        vm.expectRevert("COOLDOWN_ACTIVE");
        w.pay(recipient, address(usdc), 25e6, bytes32(0));

        // Warp 61 seconds, should succeed now
        vm.warp(block.timestamp + 61);

        vm.prank(agent);
        w.pay(recipient, address(usdc), 25e6, bytes32(0));
        assertEq(usdc.balanceOf(recipient), 50e6, "recipient received after cooldown");
    }

    // -------------------------------------------------------
    // 11. test_emergencyWithdrawERC20
    // -------------------------------------------------------
    function test_emergencyWithdrawERC20() public {
        uint256 walletBalance = usdc.balanceOf(address(wallet));
        assertGt(walletBalance, 0, "wallet should have USDC");
        uint256 ownerBefore = usdc.balanceOf(owner);

        vm.prank(owner);
        wallet.emergencyWithdraw(address(usdc));

        assertEq(usdc.balanceOf(address(wallet)), 0, "wallet drained");
        assertEq(usdc.balanceOf(owner), ownerBefore + walletBalance, "owner received");
    }

    // -------------------------------------------------------
    // 12. test_emergencyWithdrawETH
    // -------------------------------------------------------
    function test_emergencyWithdrawETH() public {
        // Fund wallet with 1 ETH
        deal(address(wallet), 1 ether);
        assertEq(address(wallet).balance, 1 ether, "wallet has ETH");

        uint256 ownerBefore = owner.balance;

        vm.prank(owner);
        wallet.emergencyWithdraw(address(0));

        assertEq(address(wallet).balance, 0, "wallet ETH drained");
        assertEq(owner.balance, ownerBefore + 1 ether, "owner received ETH");
    }

    // -------------------------------------------------------
    // 13. test_agentRevokedCannotPay
    // -------------------------------------------------------
    function test_agentRevokedCannotPay() public {
        vm.prank(owner);
        wallet.revokeAgent();

        assertFalse(wallet.isAgentActive(), "agent should be inactive");

        vm.prank(agent);
        vm.expectRevert("AgentWallet: not active agent");
        wallet.pay(recipient, address(usdc), 25e6, bytes32(0));
    }

    // -------------------------------------------------------
    // 14. test_onlyOwnerCanApprove
    // -------------------------------------------------------
    function test_onlyOwnerCanApprove() public {
        // Create a pending request
        vm.prank(agent);
        wallet.pay(recipient, address(usdc), 75e6, bytes32("pending"));

        uint256[] memory pending = queue.getPendingRequests(address(wallet));
        uint256 requestId = pending[0];

        // Non-owner tries to approve via the wallet's approveRequest
        vm.prank(nonOwner);
        vm.expectRevert("AgentWallet: not owner");
        wallet.approveRequest(requestId);
    }

    // -------------------------------------------------------
    // 15. test_batchPay
    // -------------------------------------------------------
    function test_batchPay() public {
        // All amounts must be within limits and below approval threshold
        address[] memory tos = new address[](3);
        tos[0] = recipient;
        tos[1] = recipient2;
        tos[2] = recipient3;

        address[] memory tokens = new address[](3);
        tokens[0] = address(usdc);
        tokens[1] = address(usdc);
        tokens[2] = address(usdc);

        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 10e6;
        amounts[1] = 20e6;
        amounts[2] = 30e6;

        vm.prank(agent);
        wallet.batchPay(tos, tokens, amounts);

        assertEq(usdc.balanceOf(recipient), 10e6, "recipient1");
        assertEq(usdc.balanceOf(recipient2), 20e6, "recipient2");
        assertEq(usdc.balanceOf(recipient3), 30e6, "recipient3");
        assertEq(wallet.dailySpent(), 60e6, "dailySpent after batch");
    }

    // -------------------------------------------------------
    // 16. test_dailyLimitResetsAfter24h
    // -------------------------------------------------------
    function test_dailyLimitResetsAfter24h() public {
        // Use policy where approval threshold won't interfere
        address[] memory tokenAllowlist = new address[](1);
        tokenAllowlist[0] = address(usdc);

        IPolicyRegistry.Policy memory policy = IPolicyRegistry.Policy({
            dailyLimit: 1000e6,
            perTxLimit: 100e6,
            approvalThreshold: 100e6,
            tokenAllowlist: tokenAllowlist,
            recipientAllowlist: new address[](0),
            swapsEnabled: true,
            allowedRouters: new address[](0),
            cooldownSeconds: 0
        });

        AgentWallet w = _createWalletWithPolicy(policy);

        // Spend up to daily limit: 10 * 100 = 1000
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(agent);
            w.pay(recipient, address(usdc), 100e6, bytes32(0));
        }

        assertEq(w.dailySpent(), 1000e6, "daily limit reached");

        // One more should fail
        vm.prank(agent);
        vm.expectRevert("EXCEEDS_DAILY_LIMIT");
        w.pay(recipient, address(usdc), 1e6, bytes32(0));

        // Warp past 24 hours
        vm.warp(block.timestamp + 24 hours + 1);

        // Now spending should work again
        vm.prank(agent);
        w.pay(recipient, address(usdc), 50e6, bytes32(0));

        assertEq(w.dailySpent(), 50e6, "daily spent reset to new amount");
    }
}
