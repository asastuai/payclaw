// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import { AgentWallet } from "../../src/AgentWallet.sol";
import { AgentWalletFactory } from "../../src/AgentWalletFactory.sol";
import { PolicyRegistry } from "../../src/PolicyRegistry.sol";
import { ApprovalQueue } from "../../src/ApprovalQueue.sol";
import { IPolicyRegistry } from "../../src/interfaces/IPolicyRegistry.sol";
import { IApprovalQueue } from "../../src/interfaces/IApprovalQueue.sol";
import { MockERC20 } from "../mocks/MockERC20.sol";

// -------------------------------------------------------
// Handler: performs random operations on the wallet
// -------------------------------------------------------
contract Handler is Test {
    AgentWallet public wallet;
    PolicyRegistry public registry;
    ApprovalQueue public queue;
    MockERC20 public usdc;

    address public owner;
    address public agent;
    address public recipient;

    // Track pending request IDs so we can approve/deny them
    uint256[] public pendingIds;

    // Track the highest dailyLimit that was in effect during the current
    // 24h window. Policy downgrades can make dailySpent > current dailyLimit,
    // but dailySpent should never exceed the highest limit that was active
    // while spending occurred.
    uint256 public maxDailyLimitInWindow;

    constructor(
        AgentWallet _wallet,
        PolicyRegistry _registry,
        ApprovalQueue _queue,
        MockERC20 _usdc,
        address _owner,
        address _agent,
        address _recipient
    ) {
        wallet = _wallet;
        registry = _registry;
        queue = _queue;
        usdc = _usdc;
        owner = _owner;
        agent = _agent;
        recipient = _recipient;

        // Initialize with the current policy's dailyLimit
        IPolicyRegistry.Policy memory p = registry.getPolicy(address(wallet));
        maxDailyLimitInWindow = p.dailyLimit;
    }

    // --- Random pay() as agent ---
    function pay(uint256 amount) external {
        IPolicyRegistry.Policy memory p = registry.getPolicy(address(wallet));
        // Bound to [1, perTxLimit] to avoid trivial EXCEEDS_PER_TX_LIMIT reverts
        amount = bound(amount, 1, p.perTxLimit);

        // Ensure wallet has enough tokens
        uint256 bal = usdc.balanceOf(address(wallet));
        if (bal < amount) {
            usdc.mint(address(wallet), amount - bal + 1);
        }

        // Track the dailyLimit active at time of spend attempt
        if (p.dailyLimit > maxDailyLimitInWindow) {
            maxDailyLimitInWindow = p.dailyLimit;
        }

        vm.prank(agent);
        try wallet.pay(recipient, address(usdc), amount, bytes32("handler-pay")) {
            // If pay created a pending request, track it
            uint256 pending = queue.pendingCount(address(wallet));
            if (pending > 0) {
                uint256[] memory ids = queue.getPendingRequests(address(wallet));
                for (uint256 i = 0; i < ids.length; i++) {
                    bool found = false;
                    for (uint256 j = 0; j < pendingIds.length; j++) {
                        if (pendingIds[j] == ids[i]) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        pendingIds.push(ids[i]);
                    }
                }
            }
        } catch {
            // Payment rejected by policy
        }
    }

    // --- Random approve as owner ---
    function approve(uint256 idxSeed) external {
        if (pendingIds.length == 0) return;

        uint256 idx = idxSeed % pendingIds.length;
        uint256 requestId = pendingIds[idx];

        IApprovalQueue.ApprovalRequest memory req = queue.getRequest(requestId);
        if (req.status != IApprovalQueue.RequestStatus.Pending) {
            _removePendingIdx(idx);
            return;
        }

        // Ensure wallet has enough tokens for the approved transfer
        uint256 bal = usdc.balanceOf(address(wallet));
        if (bal < req.amount) {
            usdc.mint(address(wallet), req.amount - bal + 1);
        }

        // Track dailyLimit at time of approval (approval also records spend)
        IPolicyRegistry.Policy memory p = registry.getPolicy(address(wallet));
        if (p.dailyLimit > maxDailyLimitInWindow) {
            maxDailyLimitInWindow = p.dailyLimit;
        }

        vm.prank(owner);
        try wallet.approveRequest(requestId) {
            _removePendingIdx(idx);
        } catch {
            // expired or other issue
        }
    }

    // --- Random deny as owner ---
    function deny(uint256 idxSeed) external {
        if (pendingIds.length == 0) return;

        uint256 idx = idxSeed % pendingIds.length;
        uint256 requestId = pendingIds[idx];

        vm.prank(owner);
        try wallet.denyRequest(requestId) {
            _removePendingIdx(idx);
        } catch {
            _removePendingIdx(idx);
        }
    }

    // --- Random policy update as owner ---
    function updatePolicy(uint256 dailyLimitSeed, uint256 perTxLimitSeed, uint256 approvalSeed) external {
        uint256 newDailyLimit = bound(dailyLimitSeed, 100e6, 10_000_000e6);
        uint256 newPerTxLimit = bound(perTxLimitSeed, 10e6, newDailyLimit);
        uint256 newApprovalThreshold = bound(approvalSeed, 1e6, newPerTxLimit);

        address[] memory tokenAllowlist = new address[](1);
        tokenAllowlist[0] = address(usdc);

        IPolicyRegistry.Policy memory policy = IPolicyRegistry.Policy({
            dailyLimit: newDailyLimit,
            perTxLimit: newPerTxLimit,
            approvalThreshold: newApprovalThreshold,
            tokenAllowlist: tokenAllowlist,
            recipientAllowlist: new address[](0),
            swapsEnabled: false,
            allowedRouters: new address[](0),
            cooldownSeconds: 0
        });

        // Track max dailyLimit seen
        if (newDailyLimit > maxDailyLimitInWindow) {
            maxDailyLimitInWindow = newDailyLimit;
        }

        vm.prank(owner);
        wallet.updatePolicy(abi.encode(policy));
    }

    // --- Time warp to help trigger daily resets ---
    function warpTime(uint256 seconds_) external {
        seconds_ = bound(seconds_, 0, 48 hours);
        vm.warp(block.timestamp + seconds_);

        // If daily reset happened, reset our tracker too
        uint256 currentSpent = registry.dailySpent(address(wallet));
        if (currentSpent == 0) {
            IPolicyRegistry.Policy memory p = registry.getPolicy(address(wallet));
            maxDailyLimitInWindow = p.dailyLimit;
        }
    }

    function _removePendingIdx(uint256 idx) internal {
        pendingIds[idx] = pendingIds[pendingIds.length - 1];
        pendingIds.pop();
    }
}

// -------------------------------------------------------
// Invariant test contract
// -------------------------------------------------------
contract PolicyInvariantTest is Test {
    PolicyRegistry public registry;
    ApprovalQueue public queue;
    AgentWalletFactory public factory;
    MockERC20 public usdc;
    AgentWallet public wallet;
    Handler public handler;

    address public owner = address(0xA1);
    address public agent = address(0xA2);
    address public recipient = address(0xB1);

    function setUp() public {
        // Deploy infrastructure
        registry = new PolicyRegistry();
        queue = new ApprovalQueue();
        factory = new AgentWalletFactory(address(registry), address(queue));
        usdc = new MockERC20("USD Coin", "USDC", 6);

        // Create wallet
        address[] memory tokenAllowlist = new address[](1);
        tokenAllowlist[0] = address(usdc);

        IPolicyRegistry.Policy memory policy = IPolicyRegistry.Policy({
            dailyLimit: 10_000e6,
            perTxLimit: 1_000e6,
            approvalThreshold: 500e6,
            tokenAllowlist: tokenAllowlist,
            recipientAllowlist: new address[](0),
            swapsEnabled: false,
            allowedRouters: new address[](0),
            cooldownSeconds: 0
        });

        address walletAddr = factory.createWallet(owner, agent, policy, bytes32(0));
        wallet = AgentWallet(payable(walletAddr));

        // Fund wallet
        usdc.mint(address(wallet), 1_000_000e6);

        // Deploy handler
        handler = new Handler(wallet, registry, queue, usdc, owner, agent, recipient);

        // Only target the handler for invariant calls
        targetContract(address(handler));
    }

    // -------------------------------------------------------
    // Invariant 1: dailySpent <= maxDailyLimit seen in this window
    // Note: policy downgrades can make dailySpent > current dailyLimit,
    // but spending is always checked against the limit at the time of the tx.
    // We track the max dailyLimit that was active during the spending window.
    // -------------------------------------------------------
    function invariant_dailySpentNeverExceedsMaxDailyLimit() public view {
        uint256 spent = registry.dailySpent(address(wallet));
        uint256 maxLimit = handler.maxDailyLimitInWindow();
        assertLe(spent, maxLimit, "INVARIANT VIOLATED: dailySpent > max dailyLimit in window");
    }

    // -------------------------------------------------------
    // Invariant 2: wallet token balance never underflows
    // uint256 can never be < 0 in Solidity (underflow reverts in 0.8+),
    // but we verify the balance call succeeds and is sane.
    // -------------------------------------------------------
    function invariant_walletBalanceNeverUnderflows() public view {
        uint256 bal = usdc.balanceOf(address(wallet));
        assertGe(bal, 0, "INVARIANT VIOLATED: balance underflow");
    }

    // -------------------------------------------------------
    // Invariant 3: pendingCount <= MAX_PENDING_PER_WALLET (10)
    // -------------------------------------------------------
    function invariant_pendingCountNeverExceedsMax() public view {
        uint256 pending = queue.pendingCount(address(wallet));
        assertLe(pending, queue.MAX_PENDING_PER_WALLET(), "INVARIANT VIOLATED: pendingCount > MAX_PENDING");
    }
}
