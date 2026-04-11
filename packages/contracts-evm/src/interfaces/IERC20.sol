// SPDX-License-Identifier: Apache-2.0
/// @title IERC20 — Standard ERC-20 token interface
/// @author PayClaw (https://github.com/asastuai/payclaw)
pragma solidity ^0.8.26;

/// @title IERC20
/// @notice Minimal ERC-20 interface used by PayClaw contracts for token interactions
/// @dev Follows the EIP-20 standard. Does not include optional name/symbol/decimals.
interface IERC20 {
    /// @notice Returns the total supply of the token
    /// @return The total number of tokens in existence
    function totalSupply() external view returns (uint256);

    /// @notice Returns the token balance of a given account
    /// @param account The address to query the balance of
    /// @return The token balance of `account`
    function balanceOf(address account) external view returns (uint256);

    /// @notice Transfers tokens from the caller to a recipient
    /// @param to The recipient address
    /// @param amount The number of tokens to transfer
    /// @return True if the transfer succeeded
    function transfer(address to, uint256 amount) external returns (bool);

    /// @notice Returns the remaining allowance that `spender` can spend on behalf of `owner`
    /// @param owner The address that granted the allowance
    /// @param spender The address allowed to spend
    /// @return The remaining allowance
    function allowance(address owner, address spender) external view returns (uint256);

    /// @notice Approves `spender` to spend up to `amount` tokens on behalf of the caller
    /// @param spender The address authorized to spend
    /// @param amount The maximum amount of tokens that can be spent
    /// @return True if the approval succeeded
    function approve(address spender, uint256 amount) external returns (bool);

    /// @notice Transfers tokens from one address to another using the allowance mechanism
    /// @param from The address to transfer tokens from
    /// @param to The address to transfer tokens to
    /// @param amount The number of tokens to transfer
    /// @return True if the transfer succeeded
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}
