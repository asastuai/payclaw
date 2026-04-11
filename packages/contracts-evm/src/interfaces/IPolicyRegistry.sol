// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

interface IPolicyRegistry {
    struct Policy {
        uint256 dailyLimit;
        uint256 perTxLimit;
        uint256 approvalThreshold;
        address[] tokenAllowlist;
        address[] recipientAllowlist;
        bool swapsEnabled;
        address[] allowedRouters;
        uint40 cooldownSeconds;
    }

    struct CheckResult {
        bool allowed;
        bool needsApproval;
        string reason;
    }

    event PolicySet(address indexed wallet, bytes32 policyHash);

    function setFactory(address _factory) external;

    function registerWallet(address wallet, address walletOwner, Policy calldata policy) external;

    function getPolicy(address wallet) external view returns (Policy memory);

    function setPolicy(address wallet, Policy calldata policy) external;

    function checkTransaction(
        address wallet,
        address to,
        address token,
        uint256 usdValue
    ) external view returns (CheckResult memory);

    function recordSpend(address wallet, uint256 usdValue) external;

    function dailySpent(address wallet) external view returns (uint256);

    function lastTxTimestamp(address wallet) external view returns (uint40);
}
