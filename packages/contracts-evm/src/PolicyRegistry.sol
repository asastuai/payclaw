// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import { IPolicyRegistry } from "./interfaces/IPolicyRegistry.sol";

contract PolicyRegistry is IPolicyRegistry {
    mapping(address wallet => Policy) private _policies;
    mapping(address wallet => uint256) private _dailySpent;
    mapping(address wallet => uint40) private _lastTxTimestamp;
    mapping(address wallet => uint40) private _lastResetTimestamp;

    mapping(address wallet => address) private _walletOwners;

    modifier onlyWalletOrOwner(address wallet) {
        require(
            msg.sender == wallet || msg.sender == _walletOwners[wallet],
            "PolicyRegistry: not authorized"
        );
        _;
    }

    function registerWallet(address wallet, address walletOwner, Policy calldata policy) external {
        require(_walletOwners[wallet] == address(0), "PolicyRegistry: already registered");
        _walletOwners[wallet] = walletOwner;
        _policies[wallet] = policy;
        _lastResetTimestamp[wallet] = uint40(block.timestamp);
        emit PolicySet(wallet, keccak256(abi.encode(policy)));
    }

    function getPolicy(address wallet) external view returns (Policy memory) {
        return _policies[wallet];
    }

    function setPolicy(address wallet, Policy calldata policy) external onlyWalletOrOwner(wallet) {
        _policies[wallet] = policy;
        emit PolicySet(wallet, keccak256(abi.encode(policy)));
    }

    function checkTransaction(
        address wallet,
        address to,
        address token,
        uint256 usdValue
    ) external view returns (CheckResult memory) {
        Policy storage p = _policies[wallet];

        // Token allowlist
        if (p.tokenAllowlist.length > 0 && !_isInList(p.tokenAllowlist, token)) {
            return CheckResult(false, false, "TOKEN_NOT_ALLOWED");
        }

        // Recipient allowlist
        if (p.recipientAllowlist.length > 0 && !_isInList(p.recipientAllowlist, to)) {
            return CheckResult(false, false, "RECIPIENT_NOT_ALLOWED");
        }

        // Per-tx limit
        if (usdValue > p.perTxLimit) {
            return CheckResult(false, false, "EXCEEDS_PER_TX_LIMIT");
        }

        // Daily limit (auto-reset after 24h)
        uint256 currentDailySpent = _getCurrentDailySpent(wallet);
        if (currentDailySpent + usdValue > p.dailyLimit) {
            return CheckResult(false, false, "EXCEEDS_DAILY_LIMIT");
        }

        // Cooldown
        if (block.timestamp - _lastTxTimestamp[wallet] < p.cooldownSeconds) {
            return CheckResult(false, false, "COOLDOWN_ACTIVE");
        }

        // Approval threshold
        if (usdValue > p.approvalThreshold) {
            return CheckResult(true, true, "REQUIRES_APPROVAL");
        }

        return CheckResult(true, false, "");
    }

    function recordSpend(address wallet, uint256 usdValue) external onlyWalletOrOwner(wallet) {
        _maybeResetDaily(wallet);
        _dailySpent[wallet] += usdValue;
        _lastTxTimestamp[wallet] = uint40(block.timestamp);
    }

    function dailySpent(address wallet) external view returns (uint256) {
        return _getCurrentDailySpent(wallet);
    }

    function lastTxTimestamp(address wallet) external view returns (uint40) {
        return _lastTxTimestamp[wallet];
    }

    // --- Internal ---

    function _getCurrentDailySpent(address wallet) internal view returns (uint256) {
        if (block.timestamp - _lastResetTimestamp[wallet] >= 24 hours) {
            return 0;
        }
        return _dailySpent[wallet];
    }

    function _maybeResetDaily(address wallet) internal {
        if (block.timestamp - _lastResetTimestamp[wallet] >= 24 hours) {
            _dailySpent[wallet] = 0;
            _lastResetTimestamp[wallet] = uint40(block.timestamp);
        }
    }

    function _isInList(address[] storage list, address target) internal view returns (bool) {
        for (uint256 i = 0; i < list.length; i++) {
            if (list[i] == target) return true;
        }
        return false;
    }
}
