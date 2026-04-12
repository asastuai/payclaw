// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import { AgentWallet } from "../src/AgentWallet.sol";
import { AgentWalletFactory } from "../src/AgentWalletFactory.sol";
import { PolicyRegistry } from "../src/PolicyRegistry.sol";
import { ApprovalQueue } from "../src/ApprovalQueue.sol";
import { IPolicyRegistry } from "../src/interfaces/IPolicyRegistry.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";

contract FuzzTest is Test {
    PolicyRegistry public registry;
    ApprovalQueue public queue;
    AgentWalletFactory public factory;
    MockERC20 public usdc;

    address public owner = address(0xA1);
    address public agent = address(0xA2);
    address public recipient = address(0xB1);

    // Policy constants used across tests
    uint256 constant DAILY_LIMIT = 1_000_000e6;
    uint256 constant PER_TX_LIMIT = 100_000e6;
    uint256 constant APPROVAL_THRESHOLD = 100_000e6; // equal to perTxLimit so nothing gets queued
    uint40 constant COOLDOWN = 0;

    function setUp() public {
        registry = new PolicyRegistry();
        queue = new ApprovalQueue();
        factory = new AgentWalletFactory(address(registry), address(queue));
        usdc = new MockERC20("USD Coin", "USDC", 6);
    }

    // -------------------------------------------------------
    // Helper: create a wallet with given policy params
    // -------------------------------------------------------
    function _createWallet(
        uint256 dailyLimit,
        uint256 perTxLimit,
        uint256 approvalThreshold,
        uint40 cooldownSeconds,
        bytes32 salt
    ) internal returns (AgentWallet) {
        address[] memory tokenAllowlist = new address[](1);
        tokenAllowlist[0] = address(usdc);

        IPolicyRegistry.Policy memory policy = IPolicyRegistry.Policy({
            dailyLimit: dailyLimit,
            perTxLimit: perTxLimit,
            approvalThreshold: approvalThreshold,
            tokenAllowlist: tokenAllowlist,
            recipientAllowlist: new address[](0),
            swapsEnabled: false,
            allowedRouters: new address[](0),
            cooldownSeconds: cooldownSeconds
        });

        address walletAddr = factory.createWallet(owner, agent, policy, salt);
        AgentWallet w = AgentWallet(payable(walletAddr));
        // Fund generously so balance is never the bottleneck
        usdc.mint(address(w), type(uint128).max);
        return w;
    }

    // -------------------------------------------------------
    // 1. testFuzz_payAmountWithinPerTxLimit
    // -------------------------------------------------------
    function testFuzz_payAmountWithinPerTxLimit(uint256 amount) public {
        amount = bound(amount, 1, PER_TX_LIMIT);

        AgentWallet w = _createWallet(DAILY_LIMIT, PER_TX_LIMIT, APPROVAL_THRESHOLD, 0, bytes32(uint256(1)));

        uint256 recipientBefore = usdc.balanceOf(recipient);

        vm.prank(agent);
        w.pay(recipient, address(usdc), amount, bytes32("fuzz-within"));

        uint256 fee = (amount * 30) / 10000;
        assertEq(usdc.balanceOf(recipient), recipientBefore + amount - fee, "recipient should receive amount minus fee");
        assertEq(w.dailySpent(), amount, "dailySpent should equal amount");
    }

    // -------------------------------------------------------
    // 2. testFuzz_payAmountExceedsPerTxLimit
    // -------------------------------------------------------
    function testFuzz_payAmountExceedsPerTxLimit(uint256 amount) public {
        amount = bound(amount, PER_TX_LIMIT + 1, type(uint128).max);

        AgentWallet w = _createWallet(DAILY_LIMIT, PER_TX_LIMIT, APPROVAL_THRESHOLD, 0, bytes32(uint256(2)));

        vm.prank(agent);
        vm.expectRevert("EXCEEDS_PER_TX_LIMIT");
        w.pay(recipient, address(usdc), amount, bytes32("fuzz-exceeds"));
    }

    // -------------------------------------------------------
    // 3. testFuzz_dailyLimitNeverExceeded
    // -------------------------------------------------------
    function testFuzz_dailyLimitNeverExceeded(uint256[] calldata amounts) public {
        // Cap array length to avoid running forever
        uint256 len = amounts.length > 50 ? 50 : amounts.length;
        if (len == 0) return;

        AgentWallet w = _createWallet(DAILY_LIMIT, PER_TX_LIMIT, APPROVAL_THRESHOLD, 0, bytes32(uint256(3)));

        uint256 totalSpent = 0;

        for (uint256 i = 0; i < len; i++) {
            uint256 amt = bound(amounts[i], 1, PER_TX_LIMIT);

            if (totalSpent + amt > DAILY_LIMIT) {
                // Should revert — daily limit would be exceeded
                vm.prank(agent);
                vm.expectRevert("EXCEEDS_DAILY_LIMIT");
                w.pay(recipient, address(usdc), amt, bytes32("fuzz-daily"));
                // dailySpent unchanged
            } else {
                vm.prank(agent);
                w.pay(recipient, address(usdc), amt, bytes32("fuzz-daily"));
                totalSpent += amt;
            }

            // INVARIANT: dailySpent never exceeds dailyLimit
            assertLe(w.dailySpent(), DAILY_LIMIT, "dailySpent must never exceed dailyLimit");
        }
    }

    // -------------------------------------------------------
    // 4. testFuzz_approvalThresholdCorrect
    // -------------------------------------------------------
    function testFuzz_approvalThresholdCorrect(uint256 amount) public {
        uint256 approvalThreshold = 50_000e6;
        // Amount above threshold but within perTxLimit => queued, not executed
        amount = bound(amount, approvalThreshold + 1, PER_TX_LIMIT);

        AgentWallet w = _createWallet(DAILY_LIMIT, PER_TX_LIMIT, approvalThreshold, 0, bytes32(uint256(4)));

        uint256 walletBefore = usdc.balanceOf(address(w));

        vm.prank(agent);
        w.pay(recipient, address(usdc), amount, bytes32("fuzz-approval"));

        // No transfer should have happened — request was queued
        assertEq(usdc.balanceOf(address(w)), walletBefore, "wallet balance unchanged - queued");
        assertEq(usdc.balanceOf(recipient), 0, "recipient got nothing - queued");
        assertEq(w.pendingRequestCount(), 1, "one pending request");
    }

    // -------------------------------------------------------
    // 5. testFuzz_cooldownEnforced
    // -------------------------------------------------------
    function testFuzz_cooldownEnforced(uint256 waitTime) public {
        uint40 cooldownSec = 120; // 2 minutes

        AgentWallet w = _createWallet(DAILY_LIMIT, PER_TX_LIMIT, APPROVAL_THRESHOLD, cooldownSec, bytes32(uint256(5)));

        // Warp well past zero so initial cooldown check (lastTxTimestamp=0) passes
        vm.warp(block.timestamp + 1000);

        // First payment succeeds
        vm.prank(agent);
        w.pay(recipient, address(usdc), 1e6, bytes32("cd-first"));

        // --- Part A: waitTime < cooldownSeconds => should revert ---
        uint256 snapshot = vm.snapshotState();

        uint256 shortWait = bound(waitTime, 0, uint256(cooldownSec) - 1);
        vm.warp(block.timestamp + shortWait);

        vm.prank(agent);
        vm.expectRevert("COOLDOWN_ACTIVE");
        w.pay(recipient, address(usdc), 1e6, bytes32("cd-too-early"));

        vm.revertToState(snapshot);

        // --- Part B: waitTime >= cooldownSeconds => should succeed ---
        uint256 longWait = bound(waitTime, uint256(cooldownSec), uint256(cooldownSec) * 2);
        vm.warp(block.timestamp + longWait);

        vm.prank(agent);
        w.pay(recipient, address(usdc), 1e6, bytes32("cd-ok"));

        // Verify it went through
        assertEq(w.dailySpent(), 2e6, "two payments recorded");
    }
}
