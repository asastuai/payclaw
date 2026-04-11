// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

interface IAgentWallet {
    // --- Events ---
    event PaymentExecuted(address indexed to, address indexed token, uint256 amount, bytes32 memo);
    event SwapExecuted(address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);
    event ApprovalRequested(uint256 indexed requestId, address indexed to, address indexed token, uint256 amount);
    event AgentSet(address indexed agent);
    event AgentRevoked(address indexed agent);
    event EmergencyWithdraw(address indexed token, uint256 amount);
    event PolicyUpdated(bytes32 indexed policyId);

    // --- Core Actions (called by agent via UserOp) ---
    function pay(address to, address token, uint256 amount, bytes32 memo) external;
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address router
    ) external;
    function batchPay(address[] calldata tos, address[] calldata tokens, uint256[] calldata amounts) external;

    // --- Owner Actions ---
    function approveRequest(uint256 requestId) external;
    function denyRequest(uint256 requestId) external;
    function updatePolicy(bytes calldata policyData) external;
    function setAgent(address agent) external;
    function revokeAgent() external;
    function emergencyWithdraw(address token) external;

    // --- View Functions ---
    function owner() external view returns (address);
    function agent() external view returns (address);
    function isAgentActive() external view returns (bool);
    function dailySpent() external view returns (uint256);
    function pendingRequestCount() external view returns (uint256);
}
