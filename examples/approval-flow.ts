/**
 * Approval Flow Example
 *
 * Demonstrates the full approval lifecycle:
 * 1. Create a wallet with a low approval threshold
 * 2. Agent makes a payment above the threshold — triggers approval request
 * 3. Owner reviews and approves the request
 * 4. Agent makes another payment — owner denies it
 *
 * The approval flow is designed for AI agents that need human oversight:
 * the agent can queue payments, and a human (or higher-privilege system)
 * approves or denies them.
 *
 * Prerequisites:
 *   - Set OWNER_PRIVATE_KEY and AGENT_PRIVATE_KEY env vars
 *   - Fund the owner with Base Sepolia ETH for gas
 *   - Fund the wallet with testnet USDC after creation
 *
 * Run:
 *   npx ts-node examples/approval-flow.ts
 */

import { PayClaw, PolicyEngine } from '@payclaw/sdk';
import type { PayClawEvent } from '@payclaw/sdk';

async function main() {
  // -------------------------------------------------------
  // Step 1: Initialize SDK and create wallet
  // -------------------------------------------------------
  const payclaw = new PayClaw({ chain: 'base-sepolia' });

  const wallet = await payclaw.createWallet({
    ownerPrivateKey: process.env.OWNER_PRIVATE_KEY!,
    agentPrivateKey: process.env.AGENT_PRIVATE_KEY!,
    policies: {
      dailyLimit: 1000,
      perTransactionLimit: 200,
      approvalThreshold: 25,    // Low threshold: anything above $25 needs approval
      allowedTokens: ['USDC'],
    },
  });

  console.log(`Wallet deployed at: ${wallet.address}`);
  console.log(`Approval threshold: $${wallet.policies.approvalThreshold}`);
  console.log();

  // -------------------------------------------------------
  // Step 2: Set up event listeners
  // -------------------------------------------------------
  // In production, these events would trigger notifications
  // (email, Slack, Telegram, etc.) to the wallet owner.

  const pendingRequests: string[] = [];

  wallet.on('payment:executed', (event) => {
    console.log(`[Event] Payment executed! Tx: ${event.tx.txHash}`);
  });

  wallet.on('approval:pending', (event) => {
    console.log(`[Event] Approval needed!`);
    console.log(`  Request ID: ${event.request.id}`);
    console.log(`  Amount: ${event.request.amount} ${event.request.token}`);
    console.log(`  To: ${event.request.to}`);
    console.log(`  Expires: ${event.request.expiresAt.toISOString()}`);
    pendingRequests.push(event.request.id);
  });

  // -------------------------------------------------------
  // Step 3: Small payment (below threshold) — instant
  // -------------------------------------------------------
  console.log('--- Small payment ($20 USDC, below $25 threshold) ---');

  // First, validate client-side (optional but saves gas on failures)
  const engine = new PolicyEngine(wallet.policies);
  const preCheck = engine.validatePay(
    { to: '0x000000000000000000000000000000000000dEaD', token: 'USDC', amount: 20 },
    0,
  );
  console.log(`Pre-check: allowed=${preCheck.allowed}, needsApproval=${preCheck.needsApproval}`);

  const smallReceipt = await wallet.pay({
    to: '0x000000000000000000000000000000000000dEaD',
    token: 'USDC',
    amount: 20,
    memo: 'Small payment — no approval',
  });
  console.log(`Result: ${smallReceipt.status} (tx: ${smallReceipt.txHash})`);
  console.log();

  // -------------------------------------------------------
  // Step 4: Large payment (above threshold) — needs approval
  // -------------------------------------------------------
  console.log('--- Large payment ($75 USDC, above $25 threshold) ---');

  const preCheck2 = engine.validatePay(
    { to: '0x000000000000000000000000000000000000dEaD', token: 'USDC', amount: 75 },
    20, // $20 spent from the previous payment
  );
  console.log(`Pre-check: allowed=${preCheck2.allowed}, needsApproval=${preCheck2.needsApproval}`);

  // The agent submits the payment. On-chain, this creates an ApprovalRequest
  // instead of executing immediately.
  const largeReceipt = await wallet.pay({
    to: '0x000000000000000000000000000000000000dEaD',
    token: 'USDC',
    amount: 75,
    memo: 'Needs owner approval',
  });
  console.log(`Submitted: ${largeReceipt.status} (tx: ${largeReceipt.txHash})`);
  console.log();

  // -------------------------------------------------------
  // Step 5: Owner approves the request
  // -------------------------------------------------------
  // In a real app, the owner would review this in a dashboard
  // or receive a notification and approve via the SDK.
  if (pendingRequests.length > 0) {
    const requestId = pendingRequests[0];
    console.log(`--- Owner approving request ${requestId} ---`);

    const approveReceipt = await wallet.approve(requestId);
    console.log(`Approved! Status: ${approveReceipt.status} (tx: ${approveReceipt.txHash})`);
    console.log();
  }

  // -------------------------------------------------------
  // Step 6: Another large payment — owner denies this one
  // -------------------------------------------------------
  console.log('--- Another large payment ($150 USDC) ---');

  const anotherReceipt = await wallet.pay({
    to: '0x000000000000000000000000000000000000dEaD',
    token: 'USDC',
    amount: 150,
    memo: 'This will be denied',
  });
  console.log(`Submitted: ${anotherReceipt.status} (tx: ${anotherReceipt.txHash})`);

  if (pendingRequests.length > 1) {
    const requestId = pendingRequests[1];
    console.log(`\n--- Owner denying request ${requestId} ---`);

    const denyReceipt = await wallet.deny(requestId);
    console.log(`Denied! Status: ${denyReceipt.status} (tx: ${denyReceipt.txHash})`);
    console.log('Funds remain in the wallet.');
  }

  // -------------------------------------------------------
  // Step 7: Check final state
  // -------------------------------------------------------
  console.log('\n--- Final wallet state ---');

  const limits = await wallet.getRemainingLimits();
  console.log(`Daily spent: $${limits.dailySpent} / $${limits.dailyLimit}`);
  console.log(`Remaining: $${limits.dailyRemaining}`);

  const txs = await wallet.getTransactions({ limit: 10 });
  console.log(`\nTransaction history (${txs.length} txs):`);
  for (const tx of txs) {
    console.log(`  [${tx.type}] ${tx.amount} ${tx.token} — ${tx.status}`);
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
