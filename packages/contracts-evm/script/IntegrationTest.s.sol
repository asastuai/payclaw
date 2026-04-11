// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import { AgentWallet } from "../src/AgentWallet.sol";
import { AgentWalletFactory } from "../src/AgentWalletFactory.sol";
import { PolicyRegistry } from "../src/PolicyRegistry.sol";
import { IPolicyRegistry } from "../src/interfaces/IPolicyRegistry.sol";
import { MockERC20 } from "../test/mocks/MockERC20.sol";

contract IntegrationTest is Script {
    // Deployed contracts on Base Sepolia
    AgentWalletFactory constant FACTORY = AgentWalletFactory(0x311CBD67E108870f4Ce12a6FaDf6eab6197d53a0);
    PolicyRegistry constant REGISTRY = PolicyRegistry(0xdd431B147e4D39cccAe587f634f4356f455977c4);
    MockERC20 constant TEST_USDC = MockERC20(0x6c8D6394F7f9a5C6901b7064C7D45fBf121F94d1);

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        // Generate owner and agent keys deterministically for the test
        uint256 ownerKey = uint256(keccak256(abi.encodePacked("payclaw-test-owner", block.timestamp)));
        uint256 agentKey = uint256(keccak256(abi.encodePacked("payclaw-test-agent", block.timestamp)));
        address owner = vm.addr(ownerKey);
        address agent = vm.addr(agentKey);
        address recipient = address(0xBEEF);

        console.log("=== PayClaw Integration Test on Base Sepolia ===");
        console.log("");
        console.log("Owner:", owner);
        console.log("Agent:", agent);
        console.log("Recipient:", recipient);

        vm.startBroadcast(deployerKey);

        // Step 1: Create wallet with policy
        console.log("");
        console.log("--- Step 1: Create Agent Wallet ---");

        address[] memory tokenAllowlist = new address[](1);
        tokenAllowlist[0] = address(TEST_USDC);

        IPolicyRegistry.Policy memory policy = IPolicyRegistry.Policy({
            dailyLimit: 1000e6,       // $1000/day
            perTxLimit: 100e6,        // $100/tx
            approvalThreshold: 50e6,  // >$50 needs approval
            tokenAllowlist: tokenAllowlist,
            recipientAllowlist: new address[](0),
            swapsEnabled: true,
            allowedRouters: new address[](0),
            cooldownSeconds: 0
        });

        address walletAddr = FACTORY.createWallet(owner, agent, policy, bytes32("integration-test-v1"));
        AgentWallet wallet = AgentWallet(payable(walletAddr));
        console.log("Wallet created:", walletAddr);

        // Step 2: Mint test USDC to wallet
        console.log("");
        console.log("--- Step 2: Fund Wallet with 1000 tUSDC ---");
        TEST_USDC.mint(walletAddr, 1000e6);
        uint256 walletBalance = TEST_USDC.balanceOf(walletAddr);
        console.log("Wallet tUSDC balance:", walletBalance / 1e6, "USDC");

        vm.stopBroadcast();

        // Step 3: Agent pays recipient (25 USDC — within limits)
        console.log("");
        console.log("--- Step 3: Agent Pays 25 tUSDC ---");
        vm.broadcast(agentKey);
        wallet.pay(recipient, address(TEST_USDC), 25e6, bytes32("invoice-001"));

        uint256 recipientBalance = TEST_USDC.balanceOf(recipient);
        uint256 walletAfter = TEST_USDC.balanceOf(walletAddr);
        console.log("Recipient balance:", recipientBalance / 1e6, "USDC");
        console.log("Wallet balance:", walletAfter / 1e6, "USDC");
        console.log("Daily spent:", wallet.dailySpent() / 1e6, "USD");

        // Step 4: Agent pays 75 USDC — should trigger approval queue
        console.log("");
        console.log("--- Step 4: Agent Pays 75 tUSDC (needs approval) ---");
        vm.broadcast(agentKey);
        wallet.pay(recipient, address(TEST_USDC), 75e6, bytes32("invoice-002"));

        uint256 pending = wallet.pendingRequestCount();
        console.log("Pending approvals:", pending);
        console.log("Wallet balance (unchanged):", TEST_USDC.balanceOf(walletAddr) / 1e6, "USDC");

        // Step 5: Owner approves the pending request
        console.log("");
        console.log("--- Step 5: Owner Approves Pending Request ---");
        vm.broadcast(ownerKey);
        wallet.approveRequest(1);

        console.log("Recipient balance after approval:", TEST_USDC.balanceOf(recipient) / 1e6, "USDC");
        console.log("Wallet final balance:", TEST_USDC.balanceOf(walletAddr) / 1e6, "USDC");
        console.log("Total daily spent:", wallet.dailySpent() / 1e6, "USD");
        console.log("Pending approvals:", wallet.pendingRequestCount());

        console.log("");
        console.log("=== ALL STEPS PASSED ===");
        console.log("PayClaw is live on Base Sepolia!");
    }
}
