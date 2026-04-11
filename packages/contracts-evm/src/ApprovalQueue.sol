// SPDX-License-Identifier: Apache-2.0
/// @title ApprovalQueue — Human-in-the-loop approval queue for high-value agent transactions
/// @author PayClaw (https://github.com/asastuai/payclaw)
pragma solidity ^0.8.26;

import { IApprovalQueue } from "./interfaces/IApprovalQueue.sol";

/// @title ApprovalQueue
/// @notice Manages a queue of pending approval requests for agent wallet transactions that
///         exceed the autonomous spending threshold, requiring explicit human approval or denial
/// @dev Requests are created by wallets when a transaction needs approval. Each wallet can have
///      at most MAX_PENDING_PER_WALLET pending requests. Requests expire after DEFAULT_EXPIRY (24h).
///      Only the factory can register wallets (C-3). Only wallets or their owners can manage requests.
/// @author PayClaw (https://github.com/asastuai/payclaw)
contract ApprovalQueue is IApprovalQueue {
    /// @dev Auto-incrementing counter for request IDs, starting at 1 (0 is reserved as invalid)
    uint256 private _nextRequestId = 1;

    /// @notice Maximum number of simultaneous pending requests per wallet
    uint256 public constant MAX_PENDING_PER_WALLET = 10;

    /// @notice Default time-to-live for approval requests (24 hours)
    uint256 public constant DEFAULT_EXPIRY = 24 hours;

    /// @dev Mapping from request ID to its full ApprovalRequest data
    mapping(uint256 => ApprovalRequest) private _requests;
    /// @dev Mapping from wallet address to its array of pending request IDs
    mapping(address => uint256[]) private _walletPendingIds;
    /// @dev Mapping from wallet address to its registered human owner
    mapping(address => address) private _walletOwners;

    /// @notice The factory address authorized to register wallets
    /// @dev C-3: Only the factory can register new wallets
    address public factory;

    /// @inheritdoc IApprovalQueue
    /// @dev C-3: Set the factory address (can only be set once)
    function setFactory(address _factory) external {
        require(factory == address(0), "ApprovalQueue: factory already set");
        require(_factory != address(0), "ApprovalQueue: zero address");
        factory = _factory;
    }

    /// @dev Restricts access to the wallet that created the request or its registered owner
    /// @param requestId The request ID to check authorization for
    modifier onlyWalletOrOwner(uint256 requestId) {
        address wallet = _requests[requestId].wallet;
        require(
            msg.sender == wallet || _walletOwners[wallet] == msg.sender,
            "ApprovalQueue: not authorized"
        );
        _;
    }

    /// @inheritdoc IApprovalQueue
    /// @dev C-2 + C-3: Only factory can register, prevents re-registration of existing wallets.
    function registerWallet(address wallet, address walletOwner) external {
        // C-2 + C-3: Only factory can register, prevent re-registration
        require(msg.sender == factory, "ApprovalQueue: only factory");
        require(_walletOwners[wallet] == address(0), "ApprovalQueue: already registered");
        _walletOwners[wallet] = walletOwner;
    }

    /// @inheritdoc IApprovalQueue
    /// @dev Only the wallet itself can create requests (called from AgentWallet.pay when approval needed).
    ///      Reverts if the wallet already has MAX_PENDING_PER_WALLET pending requests.
    function createRequest(
        address wallet,
        address to,
        address token,
        uint256 amount,
        bytes32 memo
    ) external returns (uint256 requestId) {
        require(msg.sender == wallet, "ApprovalQueue: only wallet");
        require(
            _walletPendingIds[wallet].length < MAX_PENDING_PER_WALLET,
            "ApprovalQueue: max pending reached"
        );

        requestId = _nextRequestId++;

        _requests[requestId] = ApprovalRequest({
            wallet: wallet,
            to: to,
            token: token,
            amount: amount,
            memo: memo,
            createdAt: uint40(block.timestamp),
            expiresAt: uint40(block.timestamp + DEFAULT_EXPIRY),
            status: RequestStatus.Pending
        });

        _walletPendingIds[wallet].push(requestId);

        emit RequestCreated(requestId, wallet, to, amount);
    }

    /// @inheritdoc IApprovalQueue
    /// @dev Marks the request as Approved and removes it from the wallet's pending list.
    ///      Reverts if the request is not pending or has expired.
    function approveRequest(uint256 requestId) external onlyWalletOrOwner(requestId) {
        ApprovalRequest storage req = _requests[requestId];
        require(req.status == RequestStatus.Pending, "ApprovalQueue: not pending");
        require(block.timestamp <= req.expiresAt, "ApprovalQueue: expired");

        req.status = RequestStatus.Approved;
        _removePendingId(req.wallet, requestId);

        emit RequestApproved(requestId);
    }

    /// @inheritdoc IApprovalQueue
    /// @dev Marks the request as Denied and removes it from the wallet's pending list.
    ///      Reverts if the request is not pending.
    function denyRequest(uint256 requestId) external onlyWalletOrOwner(requestId) {
        ApprovalRequest storage req = _requests[requestId];
        require(req.status == RequestStatus.Pending, "ApprovalQueue: not pending");

        req.status = RequestStatus.Denied;
        _removePendingId(req.wallet, requestId);

        emit RequestDenied(requestId);
    }

    /// @inheritdoc IApprovalQueue
    function getRequest(uint256 requestId) external view returns (ApprovalRequest memory) {
        return _requests[requestId];
    }

    /// @inheritdoc IApprovalQueue
    function getPendingRequests(address wallet) external view returns (uint256[] memory) {
        return _walletPendingIds[wallet];
    }

    /// @inheritdoc IApprovalQueue
    function pendingCount(address wallet) external view returns (uint256) {
        return _walletPendingIds[wallet].length;
    }

    // --- Internal ---

    /// @dev Removes a request ID from the wallet's pending array using swap-and-pop
    /// @param wallet The wallet address whose pending list to update
    /// @param requestId The request ID to remove
    function _removePendingId(address wallet, uint256 requestId) internal {
        uint256[] storage ids = _walletPendingIds[wallet];
        for (uint256 i = 0; i < ids.length; i++) {
            if (ids[i] == requestId) {
                ids[i] = ids[ids.length - 1];
                ids.pop();
                return;
            }
        }
    }
}
