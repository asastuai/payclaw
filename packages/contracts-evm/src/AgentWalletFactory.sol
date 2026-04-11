// SPDX-License-Identifier: Apache-2.0
/// @title AgentWalletFactory — Deterministic deployer for AgentWallet minimal proxy clones
/// @author PayClaw (https://github.com/asastuai/payclaw)
pragma solidity ^0.8.26;

import { AgentWallet } from "./AgentWallet.sol";
import { IPolicyRegistry } from "./interfaces/IPolicyRegistry.sol";
import { IApprovalQueue } from "./interfaces/IApprovalQueue.sol";
import { PolicyRegistry } from "./PolicyRegistry.sol";
import { ApprovalQueue } from "./ApprovalQueue.sol";

/// @title AgentWalletFactory
/// @notice Deploys AgentWallet minimal proxy clones (EIP-1167) with deterministic CREATE2 addresses
/// @dev On construction, deploys the singleton AgentWallet implementation and registers itself
///      as the authorized factory in both PolicyRegistry and ApprovalQueue (C-3).
///      Each wallet clone is initialized with its owner, agent, and initial spending policy.
/// @author PayClaw (https://github.com/asastuai/payclaw)
contract AgentWalletFactory {
    /// @notice Emitted when a new AgentWallet clone is deployed
    /// @param wallet The deployed wallet proxy address
    /// @param owner The human owner of the wallet
    /// @param agent The AI agent address assigned to the wallet
    /// @param salt The user-provided salt used for deterministic addressing
    event WalletCreated(address indexed wallet, address indexed owner, address indexed agent, bytes32 salt);

    /// @notice The singleton AgentWallet implementation contract used for all clones
    address public immutable implementation;
    /// @notice The PolicyRegistry contract address shared by all wallets
    address public immutable policyRegistry;
    /// @notice The ApprovalQueue contract address shared by all wallets
    address public immutable approvalQueue;

    /// @notice Deploys the implementation contract and registers this factory in the registry contracts
    /// @dev Deploys a new AgentWallet as the implementation, then calls setFactory on both
    ///      PolicyRegistry and ApprovalQueue so only this factory can register new wallets (C-3).
    /// @param _policyRegistry The PolicyRegistry contract address
    /// @param _approvalQueue The ApprovalQueue contract address
    constructor(address _policyRegistry, address _approvalQueue) {
        implementation = address(new AgentWallet());
        policyRegistry = _policyRegistry;
        approvalQueue = _approvalQueue;

        // C-3: Register this factory as the only authorized registrar
        PolicyRegistry(_policyRegistry).setFactory(address(this));
        ApprovalQueue(_approvalQueue).setFactory(address(this));
    }

    /// @notice Deploys a new AgentWallet clone with a deterministic address and initial policy
    /// @dev Uses EIP-1167 minimal proxy pattern with CREATE2. The final salt is derived from
    ///      keccak256(ownerAddr, agentAddr, salt) ensuring unique addresses per owner+agent+salt combo.
    ///      Initializes the clone and registers it in PolicyRegistry and ApprovalQueue.
    /// @param ownerAddr The human owner address for the new wallet
    /// @param agentAddr The AI agent address to authorize
    /// @param initialPolicy The initial spending policy to apply
    /// @param salt A user-provided salt for deterministic address generation
    /// @return wallet The address of the newly deployed wallet clone
    function createWallet(
        address ownerAddr,
        address agentAddr,
        IPolicyRegistry.Policy calldata initialPolicy,
        bytes32 salt
    ) external returns (address wallet) {
        bytes32 finalSalt = keccak256(abi.encodePacked(ownerAddr, agentAddr, salt));

        // Minimal proxy (EIP-1167)
        bytes20 targetBytes = bytes20(implementation);
        assembly {
            let clone := mload(0x40)
            mstore(clone, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(add(clone, 0x14), targetBytes)
            mstore(add(clone, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
            wallet := create2(0, clone, 0x37, finalSalt)
        }

        require(wallet != address(0), "AgentWalletFactory: create2 failed");

        AgentWallet(payable(wallet)).initialize(ownerAddr, agentAddr, policyRegistry, approvalQueue);

        IPolicyRegistry(policyRegistry).registerWallet(wallet, ownerAddr, initialPolicy);
        IApprovalQueue(approvalQueue).registerWallet(wallet, ownerAddr);

        emit WalletCreated(wallet, ownerAddr, agentAddr, salt);
    }

    /// @notice Computes the deterministic address of a wallet clone without deploying it
    /// @dev Uses the CREATE2 address derivation formula with the EIP-1167 proxy bytecode.
    ///      Useful for pre-computing wallet addresses before deployment.
    /// @param ownerAddr The human owner address
    /// @param agentAddr The AI agent address
    /// @param salt The user-provided salt
    /// @return The predicted wallet address
    function getWalletAddress(
        address ownerAddr,
        address agentAddr,
        bytes32 salt
    ) external view returns (address) {
        bytes32 finalSalt = keccak256(abi.encodePacked(ownerAddr, agentAddr, salt));
        bytes20 targetBytes = bytes20(implementation);

        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                finalSalt,
                keccak256(
                    abi.encodePacked(
                        hex"3d602d80600a3d3981f3363d3d373d3d3d363d73",
                        targetBytes,
                        hex"5af43d82803e903d91602b57fd5bf3"
                    )
                )
            )
        );

        return address(uint160(uint256(hash)));
    }
}
