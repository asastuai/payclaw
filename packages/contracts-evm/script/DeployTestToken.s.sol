// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import { MockERC20 } from "../test/mocks/MockERC20.sol";

contract DeployTestToken is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        MockERC20 usdc = new MockERC20("Test USDC", "tUSDC", 6);

        vm.stopBroadcast();

        console.log("Test USDC:", address(usdc));
    }
}
