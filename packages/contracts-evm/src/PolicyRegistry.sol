// SPDX-License-Identifier: Apache-2.0
/// @title PolicyRegistry — On-chain policy enforcement for PayClaw agent wallets
/// @author PayClaw (https://github.com/asastuai/payclaw)
pragma solidity ^0.8.26;

import { IPolicyRegistry } from "./interfaces/IPolicyRegistry.sol";

/// @title PolicyRegistry
/// @notice Stores and enforces per-wallet spending policies including daily/per-tx limits,
///         approval thresholds, token and recipient allowlists, swap controls, and cooldowns
/// @dev Each wallet is registered by the factory with an initial policy. Daily spend tracking
///      auto-resets after 24 hours. Only wallets or their registered owners can update policies
///      and record spend. The factory address is set once during deployment (C-3).
/// @author PayClaw (https://github.com/asastuai/payclaw)
contract PolicyRegistry is IPolicyRegistry {
    /// @dev Mapping from wallet address to its spending policy
    mapping(address wallet => Policy) private _policies;
    /// @dev Mapping from wallet address to its accumulated daily spend in the current window
    mapping(address wallet => uint256) private _dailySpent;
    /// @dev Mapping from wallet address to the timestamp of its last recorded transaction
    mapping(address wallet => uint40) private _lastTxTimestamp;
    /// @dev Mapping from wallet address to the timestamp when the daily spend window last reset
    mapping(address wallet => uint40) private _lastResetTimestamp;

    /// @dev Mapping from wallet address to its registered human owner
    mapping(address wallet => address) private _walletOwners;

    /// @dev C-3: Only the factory can register new wallets
    /// @notice The factory address authorized to register wallets
    address public factory;

    /// @dev Restricts access to the wallet itself or its registered owner
    /// @param wallet The wallet address to check authorization for
    modifier onlyWalletOrOwner(address wallet) {
        require(
            msg.sender == wallet || msg.sender == _walletOwners[wallet],
            "PolicyRegistry: not authorized"
        );
        _;
    }

    /// @inheritdoc IPolicyRegistry
    /// @dev C-3: Set the factory address (can only be set once)
    function setFactory(address _factory) external {
        require(factory == address(0), "PolicyRegistry: factory already set");
        require(_factory != address(0), "PolicyRegistry: zero address");
        factory = _factory;
    }

    /// @inheritdoc IPolicyRegistry
    /// @dev C-3: Only factory can register wallets. Initializes the daily reset timestamp.
    function registerWallet(address wallet, address walletOwner, Policy calldata policy) external {
        // C-3: Only factory can register wallets
        require(msg.sender == factory, "PolicyRegistry: only factory");
        require(_walletOwners[wallet] == address(0), "PolicyRegistry: already registered");
        _walletOwners[wallet] = walletOwner;
        _policies[wallet] = policy;
        _lastResetTimestamp[wallet] = uint40(block.timestamp);
        emit PolicySet(wallet, keccak256(abi.encode(policy)));
    }

    /// @inheritdoc IPolicyRegistry
    function getPolicy(address wallet) external view returns (Policy memory) {
        return _policies[wallet];
    }

    /// @inheritdoc IPolicyRegistry
    function setPolicy(address wallet, Policy calldata policy) external onlyWalletOrOwner(wallet) {
        _policies[wallet] = policy;
        emit PolicySet(wallet, keccak256(abi.encode(policy)));
    }

    /// @inheritdoc IPolicyRegistry
    /// @dev Checks are evaluated in this order: token allowlist, recipient allowlist,
    ///      per-tx limit, daily limit, cooldown, approval threshold. Returns on the first failure.
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

    /// @inheritdoc IPolicyRegistry
    /// @dev Resets the daily counter if 24 hours have elapsed since the last reset.
    function recordSpend(address wallet, uint256 usdValue) external onlyWalletOrOwner(wallet) {
        _maybeResetDaily(wallet);
        _dailySpent[wallet] += usdValue;
        _lastTxTimestamp[wallet] = uint40(block.timestamp);
    }

    /// @inheritdoc IPolicyRegistry
    function dailySpent(address wallet) external view returns (uint256) {
        return _getCurrentDailySpent(wallet);
    }

    /// @inheritdoc IPolicyRegistry
    function lastTxTimestamp(address wallet) external view returns (uint40) {
        return _lastTxTimestamp[wallet];
    }

    // --- Internal ---

    /// @dev Returns the current daily spend, returning 0 if the 24-hour window has elapsed
    /// @param wallet The wallet address to query
    /// @return The effective daily spend amount
    function _getCurrentDailySpent(address wallet) internal view returns (uint256) {
        if (block.timestamp - _lastResetTimestamp[wallet] >= 24 hours) {
            return 0;
        }
        return _dailySpent[wallet];
    }

    /// @dev Resets the daily spend counter and timestamp if 24 hours have passed
    /// @param wallet The wallet address to potentially reset
    function _maybeResetDaily(address wallet) internal {
        if (block.timestamp - _lastResetTimestamp[wallet] >= 24 hours) {
            _dailySpent[wallet] = 0;
            _lastResetTimestamp[wallet] = uint40(block.timestamp);
        }
    }

    /// @dev Checks if an address exists in a storage array (linear scan)
    /// @param list The storage array to search
    /// @param target The address to look for
    /// @return True if `target` is found in `list`
    function _isInList(address[] storage list, address target) internal view returns (bool) {
        for (uint256 i = 0; i < list.length; i++) {
            if (list[i] == target) return true;
        }
        return false;
    }
}
