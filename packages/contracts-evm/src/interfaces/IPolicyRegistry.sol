// SPDX-License-Identifier: Apache-2.0
/// @title IPolicyRegistry — Interface for on-chain policy enforcement for PayClaw agent wallets
/// @author PayClaw (https://github.com/asastuai/payclaw)
pragma solidity ^0.8.26;

/// @title IPolicyRegistry
/// @notice Defines the interface for managing and enforcing spending policies on agent wallets
/// @dev Policies include daily limits, per-tx limits, approval thresholds, token/recipient allowlists,
///      swap controls, and cooldown periods. Implementations must track daily spend with auto-reset.
interface IPolicyRegistry {
    /// @notice Spending policy configuration for an agent wallet
    /// @param dailyLimit Maximum USD value the agent can spend per 24-hour rolling window
    /// @param perTxLimit Maximum USD value allowed in a single transaction
    /// @param approvalThreshold Transactions above this USD value require owner approval
    /// @param tokenAllowlist Whitelisted ERC-20 token addresses (empty = all allowed)
    /// @param recipientAllowlist Whitelisted recipient addresses (empty = all allowed)
    /// @param swapsEnabled Whether the agent is permitted to execute token swaps
    /// @param allowedRouters Whitelisted DEX router addresses for swaps (empty = all allowed when swaps enabled)
    /// @param cooldownSeconds Minimum seconds required between consecutive transactions
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

    /// @notice Result of a policy check against a proposed transaction
    /// @param allowed Whether the transaction is permitted by policy
    /// @param needsApproval Whether the transaction requires owner approval before execution
    /// @param reason Human-readable reason code (empty string if fully allowed)
    struct CheckResult {
        bool allowed;
        bool needsApproval;
        string reason;
    }

    /// @notice Emitted when a wallet's policy is created or updated
    /// @param wallet The agent wallet whose policy was set
    /// @param policyHash The keccak256 hash of the encoded policy for off-chain verification
    event PolicySet(address indexed wallet, bytes32 policyHash);

    /// @notice Sets the factory address that is authorized to register wallets
    /// @dev Can only be called once. Reverts if factory is already set or if `_factory` is address(0).
    /// @param _factory The AgentWalletFactory contract address
    function setFactory(address _factory) external;

    /// @notice Registers a new wallet with its owner and initial policy
    /// @dev Only callable by the factory. Reverts if wallet is already registered.
    /// @param wallet The agent wallet address to register
    /// @param walletOwner The human owner of the wallet
    /// @param policy The initial spending policy for the wallet
    function registerWallet(address wallet, address walletOwner, Policy calldata policy) external;

    /// @notice Returns the current policy for a wallet
    /// @param wallet The agent wallet address to query
    /// @return The full Policy struct for the wallet
    function getPolicy(address wallet) external view returns (Policy memory);

    /// @notice Updates the spending policy for a wallet
    /// @dev Only callable by the wallet itself or its registered owner.
    /// @param wallet The agent wallet address to update
    /// @param policy The new policy configuration
    function setPolicy(address wallet, Policy calldata policy) external;

    /// @notice Evaluates a proposed transaction against the wallet's policy
    /// @dev Pure check with no state mutation. Validates token allowlist, recipient allowlist,
    ///      per-tx limit, daily limit, cooldown, and approval threshold in that order.
    /// @param wallet The agent wallet initiating the transaction
    /// @param to The intended recipient of the transaction
    /// @param token The ERC-20 token address (or address(0) for native ETH)
    /// @param usdValue The USD-equivalent value of the transaction (8-decimal precision)
    /// @return A CheckResult indicating whether the transaction is allowed and if approval is needed
    function checkTransaction(
        address wallet,
        address to,
        address token,
        uint256 usdValue
    ) external view returns (CheckResult memory);

    /// @notice Records a completed spend against the wallet's daily budget
    /// @dev Only callable by the wallet itself or its registered owner. Auto-resets daily counter if 24h elapsed.
    /// @param wallet The agent wallet that executed the spend
    /// @param usdValue The USD-equivalent amount spent
    function recordSpend(address wallet, uint256 usdValue) external;

    /// @notice Returns the current daily spend for a wallet (resets to 0 after 24 hours)
    /// @param wallet The agent wallet address to query
    /// @return The accumulated USD spend in the current 24-hour window
    function dailySpent(address wallet) external view returns (uint256);

    /// @notice Returns the timestamp of the wallet's last recorded transaction
    /// @param wallet The agent wallet address to query
    /// @return The block timestamp of the last spend (as uint40)
    function lastTxTimestamp(address wallet) external view returns (uint40);
}
