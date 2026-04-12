// SPDX-License-Identifier: Apache-2.0
/// @title AgentWallet — Smart wallet for AI agents with programmable spending rules and human oversight
/// @author PayClaw (https://github.com/asastuai/payclaw)
pragma solidity ^0.8.26;

import { IAgentWallet } from "./interfaces/IAgentWallet.sol";
import { IPolicyRegistry } from "./interfaces/IPolicyRegistry.sol";
import { IApprovalQueue } from "./interfaces/IApprovalQueue.sol";
import { IERC20 } from "./interfaces/IERC20.sol";

/// @title AgentWallet
/// @notice Smart wallet for AI agents with programmable spending rules and human oversight
/// @dev Implements IAgentWallet. Deployed as minimal proxy clones via AgentWalletFactory.
///      All financial limits are enforced on-chain by PolicyRegistry.
///      Transactions above the approval threshold are queued in ApprovalQueue.
///      The implementation contract is locked at deploy time to prevent direct initialization (H-4).
/// @author PayClaw (https://github.com/asastuai/payclaw)
contract AgentWallet is IAgentWallet {
    /// @dev The human owner of this wallet; set during initialization
    address private _owner;
    /// @dev The AI agent address authorized to initiate transactions
    address private _agent;
    /// @dev Whether the agent is currently active and allowed to transact
    bool private _agentActive;

    /// @notice The PolicyRegistry contract used for spending limit enforcement
    IPolicyRegistry public policyRegistry;
    /// @notice The ApprovalQueue contract used for human-in-the-loop approval
    IApprovalQueue public approvalQueue;

    /// @dev Flag to ensure initialize() can only be called once (proxy pattern)
    bool private _initialized;
    /// @dev Reentrancy guard lock
    bool private _reentrancyLock;

    /// @notice Protocol fee in basis points (0.3% = 30 bps)
    uint256 public constant PROTOCOL_FEE_BPS = 30;
    /// @notice Maximum fee cap: 10000 bps = 100%
    uint256 private constant BPS_DENOMINATOR = 10000;
    /// @notice Address that receives protocol fees
    address public constant FEE_RECIPIENT = 0x340D746f9d59cF1bAde407a7660C68E53ddB967A;

    /// @dev Lock the implementation contract so it cannot be initialized directly (H-4)
    constructor() {
        _initialized = true;
    }

    /// @dev Restricts access to the wallet owner only
    modifier onlyOwner() {
        require(msg.sender == _owner, "AgentWallet: not owner");
        _;
    }

    /// @dev Restricts access to the active agent only. Reverts if agent is revoked.
    modifier onlyAgent() {
        require(msg.sender == _agent && _agentActive, "AgentWallet: not active agent");
        _;
    }

    /// @dev Prevents reentrant calls to guarded functions
    modifier nonReentrant() {
        require(!_reentrancyLock, "AgentWallet: reentrant call");
        _reentrancyLock = true;
        _;
        _reentrancyLock = false;
    }

    /// @notice Initializes the wallet proxy with owner, agent, and infrastructure addresses
    /// @dev Called once by AgentWalletFactory after clone deployment. Reverts if already initialized.
    /// @param ownerAddr The human owner address
    /// @param agentAddr The AI agent address to authorize
    /// @param policyRegistryAddr The PolicyRegistry contract address for limit enforcement
    /// @param approvalQueueAddr The ApprovalQueue contract address for human-in-the-loop approval
    function initialize(
        address ownerAddr,
        address agentAddr,
        address policyRegistryAddr,
        address approvalQueueAddr
    ) external {
        require(!_initialized, "AgentWallet: already initialized");
        _initialized = true;
        _owner = ownerAddr;
        _agent = agentAddr;
        _agentActive = true;
        policyRegistry = IPolicyRegistry(policyRegistryAddr);
        approvalQueue = IApprovalQueue(approvalQueueAddr);

        emit AgentSet(agentAddr);
    }

    // --- Core Actions ---

    /// @inheritdoc IAgentWallet
    /// @dev For MVP, usdValue == amount (assumes stablecoins with 6 decimals, value passed as 8-decimal USD).
    ///      In production, this would query a Chainlink oracle for price conversion.
    function pay(address to, address token, uint256 amount, bytes32 memo) external onlyAgent nonReentrant {
        // For MVP, usdValue == amount (assuming stablecoins with 6 decimals, value passed as 8-decimal USD)
        // In production, this would query a Chainlink oracle
        uint256 usdValue = amount;

        IPolicyRegistry.CheckResult memory result = policyRegistry.checkTransaction(
            address(this), to, token, usdValue
        );

        if (!result.allowed) {
            revert(result.reason);
        }

        if (result.needsApproval) {
            approvalQueue.createRequest(address(this), to, token, amount, memo);
            emit ApprovalRequested(approvalQueue.pendingCount(address(this)), to, token, amount);
            return;
        }

        // Execute transfer with protocol fee
        (uint256 netAmount,) = _transferWithFee(token, to, amount);
        policyRegistry.recordSpend(address(this), usdValue);

        emit PaymentExecuted(to, token, netAmount, memo);
    }

    /// @inheritdoc IAgentWallet
    /// @dev Validates swap policy, checks router against allowlist, enforces spending limits,
    ///      approves the router, executes the swap via Uniswap-style interface, then resets
    ///      the router approval to zero (H-1) and verifies minimum output (H-2).
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address router
    ) external onlyAgent nonReentrant {
        // H-2: Require minAmountOut > 0 to prevent router from stealing tokenIn
        require(minAmountOut > 0, "AgentWallet: minAmountOut must be > 0");

        // Check policy allows swaps
        IPolicyRegistry.Policy memory policy = policyRegistry.getPolicy(address(this));
        require(policy.swapsEnabled, "AgentWallet: swaps disabled");

        // Check router is allowed
        if (policy.allowedRouters.length > 0) {
            bool routerAllowed = false;
            for (uint256 i = 0; i < policy.allowedRouters.length; i++) {
                if (policy.allowedRouters[i] == router) {
                    routerAllowed = true;
                    break;
                }
            }
            require(routerAllowed, "AgentWallet: router not allowed");
        }

        // Check spending limits (using amountIn as usdValue for stablecoins)
        IPolicyRegistry.CheckResult memory result = policyRegistry.checkTransaction(
            address(this), router, tokenIn, amountIn
        );
        require(result.allowed, result.reason);

        // Approve router to spend tokenIn (C-1: use safe approve)
        _safeApprove(tokenIn, router, amountIn);

        // Record balance before swap
        uint256 balanceBefore = IERC20(tokenOut).balanceOf(address(this));

        // Call router (generic swap interface — works with Uniswap-style routers)
        // The actual swap calldata must be crafted by the SDK
        (bool success,) = router.call(
            abi.encodeWithSignature(
                "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
                amountIn,
                minAmountOut,
                _makePath(tokenIn, tokenOut),
                address(this),
                block.timestamp + 300
            )
        );
        require(success, "AgentWallet: swap failed");

        // H-1: Reset approval to 0 after swap to prevent leftover allowance attacks
        _safeApprove(tokenIn, router, 0);

        uint256 amountOut = IERC20(tokenOut).balanceOf(address(this)) - balanceBefore;
        require(amountOut >= minAmountOut, "AgentWallet: insufficient output");

        policyRegistry.recordSpend(address(this), amountIn);

        emit SwapExecuted(tokenIn, tokenOut, amountIn, amountOut);
    }

    /// @inheritdoc IAgentWallet
    /// @dev Iterates over all payments, checking policy for each. All items must be allowed without
    ///      approval. Reverts the entire batch if any single item is rejected. Max 20 items.
    function batchPay(
        address[] calldata tos,
        address[] calldata tokens,
        uint256[] calldata amounts
    ) external onlyAgent nonReentrant {
        require(
            tos.length == tokens.length && tokens.length == amounts.length,
            "AgentWallet: array length mismatch"
        );
        require(tos.length <= 20, "AgentWallet: batch too large");

        for (uint256 i = 0; i < tos.length; i++) {
            uint256 usdValue = amounts[i];

            IPolicyRegistry.CheckResult memory result = policyRegistry.checkTransaction(
                address(this), tos[i], tokens[i], usdValue
            );

            require(result.allowed && !result.needsApproval, "AgentWallet: batch item rejected");

            (uint256 netAmount,) = _transferWithFee(tokens[i], tos[i], amounts[i]);
            policyRegistry.recordSpend(address(this), usdValue);

            emit PaymentExecuted(tos[i], tokens[i], netAmount, bytes32(0));
        }
    }

    // --- Owner Actions ---

    /// @inheritdoc IAgentWallet
    /// @dev Re-checks the policy at execution time (H-3) in case the policy has changed since
    ///      the request was created. Executes the transfer and records the spend on success.
    function approveRequest(uint256 requestId) external onlyOwner nonReentrant {
        IApprovalQueue.ApprovalRequest memory req = approvalQueue.getRequest(requestId);
        require(req.wallet == address(this), "AgentWallet: wrong wallet");

        // H-3: Re-check policy at execution time (policy may have changed since request creation)
        IPolicyRegistry.CheckResult memory result = policyRegistry.checkTransaction(
            address(this), req.to, req.token, req.amount
        );
        require(result.allowed, "AgentWallet: policy check failed on approval");

        approvalQueue.approveRequest(requestId);

        // Execute the approved transaction with protocol fee
        (uint256 netAmount,) = _transferWithFee(req.token, req.to, req.amount);
        policyRegistry.recordSpend(address(this), req.amount);

        emit PaymentExecuted(req.to, req.token, req.amount, req.memo);
    }

    /// @inheritdoc IAgentWallet
    function denyRequest(uint256 requestId) external onlyOwner {
        approvalQueue.denyRequest(requestId);
    }

    /// @inheritdoc IAgentWallet
    /// @dev Decodes policyData as an IPolicyRegistry.Policy struct and forwards to PolicyRegistry.
    function updatePolicy(bytes calldata policyData) external onlyOwner {
        IPolicyRegistry.Policy memory policy = abi.decode(policyData, (IPolicyRegistry.Policy));
        policyRegistry.setPolicy(address(this), policy);
        emit PolicyUpdated(keccak256(policyData));
    }

    /// @inheritdoc IAgentWallet
    function setAgent(address newAgent) external onlyOwner {
        _agent = newAgent;
        _agentActive = true;
        emit AgentSet(newAgent);
    }

    /// @inheritdoc IAgentWallet
    function revokeAgent() external onlyOwner {
        emit AgentRevoked(_agent);
        _agentActive = false;
    }

    /// @inheritdoc IAgentWallet
    /// @dev Withdraws the entire balance of the specified token to the owner. Uses safe transfer
    ///      for ERC-20s to handle non-standard tokens like USDT (C-1).
    function emergencyWithdraw(address token) external onlyOwner nonReentrant {
        if (token == address(0)) {
            // Withdraw native ETH/BNB
            uint256 balance = address(this).balance;
            require(balance > 0, "AgentWallet: no ETH balance");
            (bool success,) = _owner.call{ value: balance }("");
            require(success, "AgentWallet: ETH transfer failed");
            emit EmergencyWithdraw(token, balance);
        } else {
            // Withdraw ERC-20 (C-1: use safe transfer for non-standard tokens)
            uint256 balance = IERC20(token).balanceOf(address(this));
            require(balance > 0, "AgentWallet: no token balance");
            _safeTransfer(token, _owner, balance);
            emit EmergencyWithdraw(token, balance);
        }
    }

    // --- View Functions ---

    /// @inheritdoc IAgentWallet
    function owner() external view returns (address) {
        return _owner;
    }

    /// @inheritdoc IAgentWallet
    function agent() external view returns (address) {
        return _agent;
    }

    /// @inheritdoc IAgentWallet
    function isAgentActive() external view returns (bool) {
        return _agentActive;
    }

    /// @inheritdoc IAgentWallet
    function dailySpent() external view returns (uint256) {
        return policyRegistry.dailySpent(address(this));
    }

    /// @inheritdoc IAgentWallet
    function pendingRequestCount() external view returns (uint256) {
        return approvalQueue.pendingCount(address(this));
    }

    // --- Internal ---

    /// @dev Transfers `amount` minus protocol fee to `to`, and fee to FEE_RECIPIENT.
    /// @param token The ERC-20 token address (address(0) for native ETH)
    /// @param to The recipient address
    /// @param amount The gross amount (fee is deducted from this)
    /// @return netAmount The amount received by the recipient
    /// @return fee The protocol fee charged
    function _transferWithFee(address token, address to, uint256 amount) internal returns (uint256 netAmount, uint256 fee) {
        fee = (amount * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
        netAmount = amount - fee;

        _transferToken(token, to, netAmount);
        if (fee > 0) {
            _transferToken(token, FEE_RECIPIENT, fee);
        }
    }

    /// @dev Transfers `amount` of `token` to `to`. Uses native ETH transfer for address(0),
    ///      otherwise uses safe ERC-20 transfer to handle non-standard tokens (C-1).
    /// @param token The ERC-20 token address (address(0) for native ETH)
    /// @param to The recipient address
    /// @param amount The amount to transfer
    function _transferToken(address token, address to, uint256 amount) internal {
        if (token == address(0)) {
            // Native ETH/BNB
            (bool success,) = to.call{ value: amount }("");
            require(success, "AgentWallet: ETH transfer failed");
        } else {
            // C-1: Use safe transfer to handle non-standard ERC-20s (USDT, etc.)
            _safeTransfer(token, to, amount);
        }
    }

    /// @dev Safe ERC-20 transfer that handles tokens returning no data (e.g. USDT)
    /// @param token The ERC-20 token contract address
    /// @param to The recipient address
    /// @param amount The amount to transfer
    function _safeTransfer(address token, address to, uint256 amount) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20(token).transfer.selector, to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))),
            "AgentWallet: token transfer failed");
    }

    /// @dev Safe ERC-20 approve that handles tokens returning no data
    /// @param token The ERC-20 token contract address
    /// @param spender The address to approve
    /// @param amount The allowance amount (set to 0 to revoke)
    function _safeApprove(address token, address spender, uint256 amount) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20(token).approve.selector, spender, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))),
            "AgentWallet: token approve failed");
    }

    /// @dev Constructs a two-element address array for Uniswap-style swap paths
    /// @param tokenIn The input token address
    /// @param tokenOut The output token address
    /// @return path A two-element array [tokenIn, tokenOut]
    function _makePath(address tokenIn, address tokenOut) internal pure returns (address[] memory) {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        return path;
    }

    /// @dev Allows this wallet to receive native ETH/BNB
    receive() external payable {}
}
