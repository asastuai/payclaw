// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import { PolicyRegistry } from "../src/PolicyRegistry.sol";
import { ApprovalQueue } from "../src/ApprovalQueue.sol";
import { AgentWalletFactory } from "../src/AgentWalletFactory.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        PolicyRegistry policyRegistry = new PolicyRegistry();
        ApprovalQueue approvalQueue = new ApprovalQueue();
        AgentWalletFactory factory = new AgentWalletFactory(
            address(policyRegistry),
            address(approvalQueue)
        );

        vm.stopBroadcast();

        console.log("PolicyRegistry:", address(policyRegistry));
        console.log("ApprovalQueue:", address(approvalQueue));
        console.log("Factory:", address(factory));
        console.log("Implementation:", factory.implementation());
    }
}
