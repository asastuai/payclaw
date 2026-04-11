// SPDX-License-Identifier: Apache-2.0
/// @title IAgentWallet — Interface for AI agent smart wallets with programmable spending rules
/// @author PayClaw (https://github.com/asastuai/payclaw)
pragma solidity ^0.8.26;

/// @title IAgentWallet
/// @notice Defines the interface for AI agent wallets with payments, swaps, and human oversight
/// @dev Implementations are deployed as minimal proxy clones via AgentWalletFactory.
///      All financial limits are enforced on-chain by PolicyRegistry.
///      Transactions above the approval threshold are queued in ApprovalQueue.
interface IAgentWallet {
    // --- Events ---

    /// @notice Emitted when a payment is successfully executed
    /// @param to The recipient address
    /// @param token The ERC-20 token used for payment (address(0) for native ETH)
    /// @param amount The amount transferred in the token's smallest unit
    /// @param memo An arbitrary 32-byte memo attached to the payment
    event PaymentExecuted(address indexed to, address indexed token, uint256 amount, bytes32 memo);

    /// @notice Emitted when a token swap is successfully executed
    /// @param tokenIn The input token address
    /// @param tokenOut The output token address
    /// @param amountIn The amount of input tokens spent
    /// @param amountOut The amount of output tokens received
    event SwapExecuted(address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);

    /// @notice Emitted when a payment exceeds the approval threshold and is queued for owner review
    /// @param requestId The approval queue request identifier
    /// @param to The intended recipient address
    /// @param token The ERC-20 token address (address(0) for native ETH)
    /// @param amount The requested transfer amount
    event ApprovalRequested(uint256 indexed requestId, address indexed to, address indexed token, uint256 amount);

    /// @notice Emitted when a new agent address is assigned to this wallet
    /// @param agent The newly assigned agent address
    event AgentSet(address indexed agent);

    /// @notice Emitted when the current agent's access is revoked
    /// @param agent The revoked agent address
    event AgentRevoked(address indexed agent);

    /// @notice Emitted when the owner withdraws all funds of a token in an emergency
    /// @param token The token withdrawn (address(0) for native ETH)
    /// @param amount The total amount withdrawn
    event EmergencyWithdraw(address indexed token, uint256 amount);

    /// @notice Emitted when the wallet's spending policy is updated
    /// @param policyId The keccak256 hash of the encoded policy data
    event PolicyUpdated(bytes32 indexed policyId);

    // --- Core Actions (called by agent) ---

    /// @notice Executes a payment from this wallet to a recipient
    /// @dev Checks policy via PolicyRegistry. If amount > approvalThreshold, queues for approval.
    ///      Uses nonReentrant guard. Emits PaymentExecuted or ApprovalRequested.
    /// @param to The recipient address
    /// @param token The ERC-20 token address (address(0) for native ETH)
    /// @param amount The amount to transfer in the token's smallest unit
    /// @param memo An arbitrary 32-byte memo for the payment
    function pay(address to, address token, uint256 amount, bytes32 memo) external;

    /// @notice Executes a token swap through an approved DEX router
    /// @dev Validates swap policy, router allowlist, and spending limits. Resets router approval after swap.
    /// @param tokenIn The input token address to sell
    /// @param tokenOut The output token address to buy
    /// @param amountIn The amount of input tokens to swap
    /// @param minAmountOut The minimum acceptable output amount (must be > 0)
    /// @param router The DEX router address to execute the swap through
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address router
    ) external;

    /// @notice Executes multiple payments in a single transaction
    /// @dev All payments must pass policy checks and none may require approval. Max 20 items per batch.
    /// @param tos Array of recipient addresses
    /// @param tokens Array of ERC-20 token addresses (address(0) for native ETH)
    /// @param amounts Array of transfer amounts
    function batchPay(address[] calldata tos, address[] calldata tokens, uint256[] calldata amounts) external;

    // --- Owner Actions ---

    /// @notice Approves a queued approval request and executes the payment
    /// @dev Re-checks policy at execution time to guard against stale approvals (H-3).
    /// @param requestId The approval queue request identifier
    function approveRequest(uint256 requestId) external;

    /// @notice Denies a queued approval request
    /// @param requestId The approval queue request identifier
    function denyRequest(uint256 requestId) external;

    /// @notice Updates the wallet's spending policy in the PolicyRegistry
    /// @param policyData ABI-encoded IPolicyRegistry.Policy struct
    function updatePolicy(bytes calldata policyData) external;

    /// @notice Sets a new agent address and activates it
    /// @param agent The new agent address to authorize
    function setAgent(address agent) external;

    /// @notice Revokes the current agent's access to this wallet
    function revokeAgent() external;

    /// @notice Withdraws the entire balance of a token to the owner in an emergency
    /// @param token The ERC-20 token address to withdraw (address(0) for native ETH)
    function emergencyWithdraw(address token) external;

    // --- View Functions ---

    /// @notice Returns the owner (human) of this wallet
    /// @return The owner address
    function owner() external view returns (address);

    /// @notice Returns the currently assigned agent address
    /// @return The agent address
    function agent() external view returns (address);

    /// @notice Returns whether the agent is currently active
    /// @return True if the agent is active and authorized to transact
    function isAgentActive() external view returns (bool);

    /// @notice Returns the USD amount spent by this wallet in the current 24-hour window
    /// @return The accumulated daily spend in 8-decimal USD
    function dailySpent() external view returns (uint256);

    /// @notice Returns the number of pending approval requests for this wallet
    /// @return The count of pending requests
    function pendingRequestCount() external view returns (uint256);
}
