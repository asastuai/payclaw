// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import { PolicyRegistry } from "../src/PolicyRegistry.sol";
import { AgentWalletFactory } from "../src/AgentWalletFactory.sol";
import { ApprovalQueue } from "../src/ApprovalQueue.sol";
import { AgentWallet } from "../src/AgentWallet.sol";
import { PoCVerifier } from "../src/PoCVerifier.sol";
import { IPolicyRegistry } from "../src/interfaces/IPolicyRegistry.sol";
import { IPoCVerifier } from "../src/interfaces/IPoCVerifier.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";

/// @notice Tests for the PolicyRegistry × PoCVerifier integration (Phase 7b).
contract PolicyRegistryPoCTest is Test {
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
    address internal stranger = address(0xC1);

    AgentWallet internal wallet;

    bytes32 internal goodCommit = keccak256("good commitment");

    function setUp() public {
        // Standard PayClaw infrastructure.
        registry = new PolicyRegistry();
        queue = new ApprovalQueue();
        factory = new AgentWalletFactory(address(registry), address(queue));
        usdc = new MockERC20("USD Coin", "USDC", 6);

        // Deploy PoCVerifier owned by verifierOwner. Approve `operator`.
        vm.prank(verifierOwner);
        verifier = new PoCVerifier(verifierOwner);
        vm.prank(verifierOwner);
        verifier.approveOperator(operator);

        // Submit a fresh commitment we can use across tests.
        vm.prank(operator);
        verifier.submitVerifiedCommitment(goodCommit, 60);

        // Create one wallet with a generous default policy.
        address[] memory tokens = new address[](1);
        tokens[0] = address(usdc);
        address[] memory recipients = new address[](0);
        address[] memory routers = new address[](0);

        IPolicyRegistry.Policy memory policy = IPolicyRegistry.Policy({
            dailyLimit: 10_000e6,
            perTxLimit: 1_000e6,
            approvalThreshold: 5_000e6,
            tokenAllowlist: tokens,
            recipientAllowlist: recipients,
            swapsEnabled: true,
            allowedRouters: routers,
            cooldownSeconds: 0
        });

        address walletAddr = factory.createWallet(walletOwner, agent, policy, bytes32(0));
        wallet = AgentWallet(payable(walletAddr));
    }

    // -------------------------------------------------------
    // setPocVerifier
    // -------------------------------------------------------

    function test_setPocVerifier_starts_zero() public view {
        assertEq(registry.pocVerifier(), address(0));
    }

    function test_setPocVerifier_sets_address() public {
        vm.expectEmit(true, false, false, false);
        emit IPolicyRegistry.PocVerifierSet(address(verifier));
        registry.setPocVerifier(address(verifier));
        assertEq(registry.pocVerifier(), address(verifier));
    }

    function test_setPocVerifier_rejects_zero_address() public {
        vm.expectRevert("PolicyRegistry: zero address");
        registry.setPocVerifier(address(0));
    }

    function test_setPocVerifier_rejects_double_set() public {
        registry.setPocVerifier(address(verifier));
        vm.expectRevert("PolicyRegistry: pocVerifier already set");
        registry.setPocVerifier(address(0xBEEF));
    }

    // -------------------------------------------------------
    // setPocRequired
    // -------------------------------------------------------

    function test_setPocRequired_owner_can_toggle() public {
        vm.expectEmit(true, false, false, true);
        emit IPolicyRegistry.PocRequiredSet(address(wallet), true);
        vm.prank(walletOwner);
        registry.setPocRequired(address(wallet), true);

        // isPocRequired returns false until the verifier is configured.
        assertFalse(registry.isPocRequired(address(wallet)));

        registry.setPocVerifier(address(verifier));
        assertTrue(registry.isPocRequired(address(wallet)));
    }

    function test_setPocRequired_wallet_itself_can_toggle() public {
        vm.prank(address(wallet));
        registry.setPocRequired(address(wallet), true);
        registry.setPocVerifier(address(verifier));
        assertTrue(registry.isPocRequired(address(wallet)));
    }

    function test_setPocRequired_stranger_rejected() public {
        vm.prank(stranger);
        vm.expectRevert("PolicyRegistry: not authorized");
        registry.setPocRequired(address(wallet), true);
    }

    function test_isPocRequired_false_when_verifier_unset_even_if_flag_is_true() public {
        vm.prank(walletOwner);
        registry.setPocRequired(address(wallet), true);
        // pocVerifier still address(0) — the registry suppresses isPocRequired.
        assertFalse(registry.isPocRequired(address(wallet)));
    }

    // -------------------------------------------------------
    // checkTransactionWithPoC
    // -------------------------------------------------------

    function test_passes_when_poc_not_required() public view {
        // PoC neither configured at registry nor required for wallet.
        IPolicyRegistry.CheckResult memory r = registry.checkTransactionWithPoC(
            address(wallet),
            recipient,
            address(usdc),
            100e6,
            bytes32(0)
        );
        assertTrue(r.allowed);
        assertEq(r.reason, "");
    }

    function test_passes_with_fresh_commitment() public {
        registry.setPocVerifier(address(verifier));
        vm.prank(walletOwner);
        registry.setPocRequired(address(wallet), true);

        IPolicyRegistry.CheckResult memory r = registry.checkTransactionWithPoC(
            address(wallet),
            recipient,
            address(usdc),
            100e6,
            goodCommit
        );
        assertTrue(r.allowed);
        assertEq(r.reason, "");
    }

    function test_rejects_stale_commitment() public {
        registry.setPocVerifier(address(verifier));
        vm.prank(walletOwner);
        registry.setPocRequired(address(wallet), true);

        // Wait past the 60s horizon used at setUp.
        vm.warp(block.timestamp + 61);

        IPolicyRegistry.CheckResult memory r = registry.checkTransactionWithPoC(
            address(wallet),
            recipient,
            address(usdc),
            100e6,
            goodCommit
        );
        assertFalse(r.allowed);
        assertEq(r.reason, "POC_STALE_OR_MISSING");
    }

    function test_rejects_missing_commitment_zero_hash() public {
        registry.setPocVerifier(address(verifier));
        vm.prank(walletOwner);
        registry.setPocRequired(address(wallet), true);

        IPolicyRegistry.CheckResult memory r = registry.checkTransactionWithPoC(
            address(wallet),
            recipient,
            address(usdc),
            100e6,
            bytes32(0)
        );
        assertFalse(r.allowed);
        assertEq(r.reason, "POC_STALE_OR_MISSING");
    }

    function test_rejects_unknown_commitment() public {
        registry.setPocVerifier(address(verifier));
        vm.prank(walletOwner);
        registry.setPocRequired(address(wallet), true);

        IPolicyRegistry.CheckResult memory r = registry.checkTransactionWithPoC(
            address(wallet),
            recipient,
            address(usdc),
            100e6,
            keccak256("never submitted")
        );
        assertFalse(r.allowed);
        assertEq(r.reason, "POC_STALE_OR_MISSING");
    }

    function test_underlying_policy_check_fails_before_poc_check() public {
        registry.setPocVerifier(address(verifier));
        vm.prank(walletOwner);
        registry.setPocRequired(address(wallet), true);

        // Per-tx limit was 1_000e6. Submit 2_000e6 with a fresh commitment.
        // The base check should fail with EXCEEDS_PER_TX_LIMIT, never reaching the PoC step.
        IPolicyRegistry.CheckResult memory r = registry.checkTransactionWithPoC(
            address(wallet),
            recipient,
            address(usdc),
            2_000e6,
            goodCommit
        );
        assertFalse(r.allowed);
        assertEq(r.reason, "EXCEEDS_PER_TX_LIMIT");
    }

    function test_passes_when_required_flag_off_even_if_verifier_set() public {
        registry.setPocVerifier(address(verifier));
        // Do NOT call setPocRequired. Default is false.

        IPolicyRegistry.CheckResult memory r = registry.checkTransactionWithPoC(
            address(wallet),
            recipient,
            address(usdc),
            100e6,
            bytes32(0)
        );
        assertTrue(r.allowed);
        assertEq(r.reason, "");
    }
}
