// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import { AgentWallet } from "./AgentWallet.sol";
import { IPolicyRegistry } from "./interfaces/IPolicyRegistry.sol";
import { IApprovalQueue } from "./interfaces/IApprovalQueue.sol";
import { PolicyRegistry } from "./PolicyRegistry.sol";
import { ApprovalQueue } from "./ApprovalQueue.sol";

contract AgentWalletFactory {
    event WalletCreated(address indexed wallet, address indexed owner, address indexed agent, bytes32 salt);

    address public immutable implementation;
    address public immutable policyRegistry;
    address public immutable approvalQueue;

    constructor(address _policyRegistry, address _approvalQueue) {
        implementation = address(new AgentWallet());
        policyRegistry = _policyRegistry;
        approvalQueue = _approvalQueue;

        // C-3: Register this factory as the only authorized registrar
        PolicyRegistry(_policyRegistry).setFactory(address(this));
        ApprovalQueue(_approvalQueue).setFactory(address(this));
    }

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
