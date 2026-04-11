/**
 * Basic Payment Example
 *
 * Demonstrates the core PayClaw flow:
 * 1. Initialize the SDK targeting Base Sepolia testnet
 * 2. Create a new AgentWallet with spending policies
 * 3. Check wallet balances
 * 4. Execute a USDC payment
 * 5. Verify the transaction
 *
 * Prerequisites:
 *   - Set OWNER_PRIVATE_KEY and AGENT_PRIVATE_KEY env vars (with 0x prefix)
 *   - Fund the owner address with Base Sepolia ETH for gas
 *   - Fund the wallet address with testnet USDC after creation
 *
 * Run:
 *   npx ts-node examples/basic-payment.ts
 */

import { PayClaw } from '@payclaw/sdk';

async function main() {
  // -------------------------------------------------------
  // Step 1: Initialize the SDK
  // -------------------------------------------------------
  // PayClaw auto-selects the right chain adapter (EVM or Solana).
  // The default public RPC is used unless you provide a custom one.
  const payclaw = new PayClaw({
    chain: 'base-sepolia',
    // rpcUrl: 'https://your-custom-rpc.example.com', // optional override
  });

  console.log(`SDK initialized for chain: ${payclaw.chain}`);

  // -------------------------------------------------------
  // Step 2: Create an AgentWallet
  // -------------------------------------------------------
  // The wallet is deployed on-chain via the AgentWalletFactory.
  // The owner controls policies; the agent executes transactions.
  const wallet = await payclaw.createWallet({
    ownerPrivateKey: process.env.OWNER_PRIVATE_KEY!,
    agentPrivateKey: process.env.AGENT_PRIVATE_KEY!,
    policies: {
      dailyLimit: 500,           // $500/day spending cap
      perTransactionLimit: 100,  // $100 max per transaction
      approvalThreshold: 50,     // Transactions above $50 need owner approval
      allowedTokens: ['USDC'],   // Agent can only use USDC
      swapsEnabled: false,       // No swaps allowed
    },
  });

  console.log(`Wallet deployed at: ${wallet.address}`);
  console.log(`Chain: ${wallet.chain}`);
  console.log(`Policies:`, wallet.policies);

  // -------------------------------------------------------
  // Step 3: Check balances
  // -------------------------------------------------------
  // At this point, the wallet is empty. Fund it with testnet USDC
  // before running the payment step.
  const balances = await wallet.getBalances();
  console.log('\nWallet balances:');
  for (const b of balances) {
    console.log(`  ${b.symbol}: ${b.balance} ($${b.usdValue})`);
  }

  // -------------------------------------------------------
  // Step 4: Execute a payment
  // -------------------------------------------------------
  // The agent sends 25 USDC to the recipient. This is under the
  // approval threshold ($50), so it executes immediately.
  const RECIPIENT = '0x000000000000000000000000000000000000dEaD'; // replace with real address
  const receipt = await wallet.pay({
    to: RECIPIENT,
    token: 'USDC',
    amount: 25,
    memo: 'Test payment from PayClaw',
  });

  console.log(`\nPayment result:`);
  console.log(`  Status: ${receipt.status}`);
  console.log(`  Tx hash: ${receipt.txHash}`);
  console.log(`  Gas used: ${receipt.gasUsed}`);

  // -------------------------------------------------------
  // Step 5: Check remaining limits
  // -------------------------------------------------------
  const limits = await wallet.getRemainingLimits();
  console.log(`\nRemaining limits:`);
  console.log(`  Daily: $${limits.dailyRemaining} / $${limits.dailyLimit}`);
  console.log(`  Per-tx max: $${limits.perTransactionLimit}`);
  console.log(`  Approval threshold: $${limits.approvalThreshold}`);
  console.log(`  Resets at: ${limits.nextResetAt.toISOString()}`);

  // -------------------------------------------------------
  // Step 6: View transaction history
  // -------------------------------------------------------
  const txs = await wallet.getTransactions({ limit: 5 });
  console.log(`\nRecent transactions:`);
  for (const tx of txs) {
    console.log(`  [${tx.type}] ${tx.amount} ${tx.token} -> ${tx.to} (${tx.status})`);
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
