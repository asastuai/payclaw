// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import { IApprovalQueue } from "./interfaces/IApprovalQueue.sol";

contract ApprovalQueue is IApprovalQueue {
    uint256 private _nextRequestId = 1;
    uint256 public constant MAX_PENDING_PER_WALLET = 10;
    uint256 public constant DEFAULT_EXPIRY = 24 hours;

    mapping(uint256 => ApprovalRequest) private _requests;
    mapping(address => uint256[]) private _walletPendingIds;
    mapping(address => address) private _walletOwners;

    /// @dev C-3: Only the factory can register new wallets
    address public factory;

    /// @dev C-3: Set the factory address (can only be set once)
    function setFactory(address _factory) external {
        require(factory == address(0), "ApprovalQueue: factory already set");
        require(_factory != address(0), "ApprovalQueue: zero address");
        factory = _factory;
    }

    modifier onlyWalletOrOwner(uint256 requestId) {
        address wallet = _requests[requestId].wallet;
        require(
            msg.sender == wallet || _walletOwners[wallet] == msg.sender,
            "ApprovalQueue: not authorized"
        );
        _;
    }

    function registerWallet(address wallet, address walletOwner) external {
        // C-2 + C-3: Only factory can register, prevent re-registration
        require(msg.sender == factory, "ApprovalQueue: only factory");
        require(_walletOwners[wallet] == address(0), "ApprovalQueue: already registered");
        _walletOwners[wallet] = walletOwner;
    }

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

    function approveRequest(uint256 requestId) external onlyWalletOrOwner(requestId) {
        ApprovalRequest storage req = _requests[requestId];
        require(req.status == RequestStatus.Pending, "ApprovalQueue: not pending");
        require(block.timestamp <= req.expiresAt, "ApprovalQueue: expired");

        req.status = RequestStatus.Approved;
        _removePendingId(req.wallet, requestId);

        emit RequestApproved(requestId);
    }

    function denyRequest(uint256 requestId) external onlyWalletOrOwner(requestId) {
        ApprovalRequest storage req = _requests[requestId];
        require(req.status == RequestStatus.Pending, "ApprovalQueue: not pending");

        req.status = RequestStatus.Denied;
        _removePendingId(req.wallet, requestId);

        emit RequestDenied(requestId);
    }

    function getRequest(uint256 requestId) external view returns (ApprovalRequest memory) {
        return _requests[requestId];
    }

    function getPendingRequests(address wallet) external view returns (uint256[] memory) {
        return _walletPendingIds[wallet];
    }

    function pendingCount(address wallet) external view returns (uint256) {
        return _walletPendingIds[wallet].length;
    }

    // --- Internal ---

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
