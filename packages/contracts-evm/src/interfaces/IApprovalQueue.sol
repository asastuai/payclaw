// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

interface IApprovalQueue {
    enum RequestStatus {
        Pending,
        Approved,
        Denied,
        Expired
    }

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

    event RequestCreated(uint256 indexed requestId, address indexed wallet, address indexed to, uint256 amount);
    event RequestApproved(uint256 indexed requestId);
    event RequestDenied(uint256 indexed requestId);
    event RequestExpired(uint256 indexed requestId);

    function setFactory(address _factory) external;

    function registerWallet(address wallet, address walletOwner) external;

    function createRequest(
        address wallet,
        address to,
        address token,
        uint256 amount,
        bytes32 memo
    ) external returns (uint256 requestId);

    function approveRequest(uint256 requestId) external;
    function denyRequest(uint256 requestId) external;

    function getRequest(uint256 requestId) external view returns (ApprovalRequest memory);
    function getPendingRequests(address wallet) external view returns (uint256[] memory);
    function pendingCount(address wallet) external view returns (uint256);
}
