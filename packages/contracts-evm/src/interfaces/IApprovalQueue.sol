// SPDX-License-Identifier: Apache-2.0
/// @title IApprovalQueue — Interface for the human-in-the-loop approval queue
/// @author PayClaw (https://github.com/asastuai/payclaw)
pragma solidity ^0.8.26;

/// @title IApprovalQueue
/// @notice Defines the interface for managing approval requests that exceed the agent's autonomous threshold
/// @dev Transactions that pass policy checks but exceed the approvalThreshold are queued here
///      for explicit owner approval or denial. Requests expire after a configurable window.
interface IApprovalQueue {
    /// @notice Lifecycle status of an approval request
    /// @param Pending Request is awaiting owner action
    /// @param Approved Request was approved and executed
    /// @param Denied Request was denied by the owner
    /// @param Expired Request expired before a decision was made
    enum RequestStatus {
        Pending,
        Approved,
        Denied,
        Expired
    }

    /// @notice Data structure for a queued approval request
    /// @param wallet The agent wallet that initiated the request
    /// @param to The intended payment recipient
    /// @param token The ERC-20 token address (address(0) for native ETH)
    /// @param amount The transfer amount in the token's smallest unit
    /// @param memo An arbitrary 32-byte memo attached to the payment
    /// @param createdAt Block timestamp when the request was created
    /// @param expiresAt Block timestamp after which the request is considered expired
    /// @param status Current lifecycle status of the request
    struct ApprovalRequest {
        address wallet;
        address to;
        address token;
        uint256 amount;
        bytes32 memo;
        uint40 createdAt;
        uint40 expiresAt;
        RequestStatus status;
    }

    /// @notice Emitted when a new approval request is created
    /// @param requestId The unique identifier of the request
    /// @param wallet The agent wallet that created the request
    /// @param to The intended recipient address
    /// @param amount The requested transfer amount
    event RequestCreated(uint256 indexed requestId, address indexed wallet, address indexed to, uint256 amount);

    /// @notice Emitted when an approval request is approved by the owner
    /// @param requestId The unique identifier of the approved request
    event RequestApproved(uint256 indexed requestId);

    /// @notice Emitted when an approval request is denied by the owner
    /// @param requestId The unique identifier of the denied request
    event RequestDenied(uint256 indexed requestId);

    /// @notice Emitted when an approval request expires without a decision
    /// @param requestId The unique identifier of the expired request
    event RequestExpired(uint256 indexed requestId);

    /// @notice Sets the factory address that is authorized to register wallets
    /// @dev Can only be called once. Reverts if factory is already set or if `_factory` is address(0).
    /// @param _factory The AgentWalletFactory contract address
    function setFactory(address _factory) external;

    /// @notice Registers a new wallet and its owner for approval tracking
    /// @dev Only callable by the factory. Reverts if wallet is already registered.
    /// @param wallet The agent wallet address to register
    /// @param walletOwner The human owner who can approve or deny requests
    function registerWallet(address wallet, address walletOwner) external;

    /// @notice Creates a new pending approval request
    /// @dev Only callable by the wallet itself. Reverts if max pending requests reached.
    /// @param wallet The agent wallet creating the request
    /// @param to The intended payment recipient
    /// @param token The ERC-20 token address (address(0) for native ETH)
    /// @param amount The transfer amount
    /// @param memo An arbitrary 32-byte memo for the payment
    /// @return requestId The unique identifier assigned to the new request
    function createRequest(
        address wallet,
        address to,
        address token,
        uint256 amount,
        bytes32 memo
    ) external returns (uint256 requestId);

    /// @notice Approves a pending request, allowing its execution
    /// @dev Only callable by the wallet or its registered owner. Reverts if not pending or expired.
    /// @param requestId The unique identifier of the request to approve
    function approveRequest(uint256 requestId) external;

    /// @notice Denies a pending request, preventing its execution
    /// @dev Only callable by the wallet or its registered owner. Reverts if not pending.
    /// @param requestId The unique identifier of the request to deny
    function denyRequest(uint256 requestId) external;

    /// @notice Returns the full details of an approval request
    /// @param requestId The unique identifier of the request to query
    /// @return The ApprovalRequest struct with all fields
    function getRequest(uint256 requestId) external view returns (ApprovalRequest memory);

    /// @notice Returns all pending request IDs for a given wallet
    /// @param wallet The agent wallet address to query
    /// @return An array of pending request IDs
    function getPendingRequests(address wallet) external view returns (uint256[] memory);

    /// @notice Returns the number of pending requests for a given wallet
    /// @param wallet The agent wallet address to query
    /// @return The count of pending approval requests
    function pendingCount(address wallet) external view returns (uint256);
}
