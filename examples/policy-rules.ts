/**
 * Policy Rules Example
 *
 * Demonstrates how PolicyEngine validates transactions client-side:
 * 1. Create policies with various restrictions
 * 2. Test different payment scenarios against the rules
 * 3. Update policies on-chain
 *
 * This example uses PolicyEngine directly for validation demos,
 * then shows how policies interact with a real wallet.
 *
 * Prerequisites:
 *   - Set OWNER_PRIVATE_KEY and AGENT_PRIVATE_KEY env vars
 *   - Fund the owner address with Base Sepolia ETH for gas
 *
 * Run:
 *   npx ts-node examples/policy-rules.ts
 */

import { PayClaw, PolicyEngine } from '@payclaw/sdk';

// -------------------------------------------------------
// Part 1: Client-side validation with PolicyEngine
// -------------------------------------------------------
// PolicyEngine lets you check if a transaction would pass
// BEFORE sending it on-chain. This saves gas on rejected txs.

function demonstratePolicyValidation() {
  console.log('=== Part 1: Client-side policy validation ===\n');

  const engine = new PolicyEngine({
    dailyLimit: 1000,           // $1,000/day
    perTransactionLimit: 200,   // $200/tx max
    approvalThreshold: 100,     // Over $100 needs approval
    allowedTokens: ['USDC', 'USDT'], // Only stablecoins
    allowedRecipients: [],      // Empty = all recipients allowed
    swapsEnabled: false,        // No swaps
    cooldownSeconds: 0,
  });

  console.log('Policy config:', engine.getConfig());
  console.log();

  // Scenario 1: Small payment — should pass instantly
  const small = engine.validatePay(
    { to: '0xBob', token: 'USDC', amount: 25 },
    0, // nothing spent today
  );
  console.log('Scenario 1 — $25 USDC payment (no daily spend):');
  console.log(`  Allowed: ${small.allowed}, Needs approval: ${small.needsApproval}`);
  // Expected: allowed=true, needsApproval=false

  // Scenario 2: Medium payment — above approval threshold
  const medium = engine.validatePay(
    { to: '0xBob', token: 'USDC', amount: 150 },
    0,
  );
  console.log('\nScenario 2 — $150 USDC payment (above $100 threshold):');
  console.log(`  Allowed: ${medium.allowed}, Needs approval: ${medium.needsApproval}, Reason: ${medium.reason}`);
  // Expected: allowed=true, needsApproval=true, reason=REQUIRES_APPROVAL

  // Scenario 3: Over per-tx limit — blocked
  const tooLarge = engine.validatePay(
    { to: '0xBob', token: 'USDC', amount: 250 },
    0,
  );
  console.log('\nScenario 3 — $250 USDC payment (above $200 per-tx limit):');
  console.log(`  Allowed: ${tooLarge.allowed}, Reason: ${tooLarge.reason}`);
  // Expected: allowed=false, reason=EXCEEDS_PER_TX_LIMIT

  // Scenario 4: Within per-tx limit but would exceed daily limit
  const dailyExceeded = engine.validatePay(
    { to: '0xBob', token: 'USDC', amount: 150 },
    900, // already spent $900 today
  );
  console.log('\nScenario 4 — $150 payment when $900 already spent today ($1,000 daily limit):');
  console.log(`  Allowed: ${dailyExceeded.allowed}, Reason: ${dailyExceeded.reason}`);
  // Expected: allowed=false, reason=EXCEEDS_DAILY_LIMIT

  // Scenario 5: Token not in allowlist
  const wrongToken = engine.validatePay(
    { to: '0xBob', token: 'ETH', amount: 10 },
    0,
  );
  console.log('\nScenario 5 — ETH payment (not in allowedTokens: USDC, USDT):');
  console.log(`  Allowed: ${wrongToken.allowed}, Reason: ${wrongToken.reason}`);
  // Expected: allowed=false, reason=TOKEN_NOT_ALLOWED

  // Scenario 6: Swap when swaps are disabled
  const swapBlocked = engine.validateSwap(
    { from: 'USDC', to: 'ETH', amount: 50 },
    0,
  );
  console.log('\nScenario 6 — Swap attempt (swapsEnabled=false):');
  console.log(`  Allowed: ${swapBlocked.allowed}, Reason: ${swapBlocked.reason}`);
  // Expected: allowed=false, reason=SWAPS_DISABLED
}

// -------------------------------------------------------
// Part 2: Updating policies on-chain
// -------------------------------------------------------
async function demonstratePolicyUpdate() {
  console.log('\n\n=== Part 2: Updating policies on a live wallet ===\n');

  const payclaw = new PayClaw({ chain: 'base-sepolia' });

  // Create a wallet with conservative policies
  const wallet = await payclaw.createWallet({
    ownerPrivateKey: process.env.OWNER_PRIVATE_KEY!,
    agentPrivateKey: process.env.AGENT_PRIVATE_KEY!,
    policies: {
      dailyLimit: 100,
      perTransactionLimit: 20,
      approvalThreshold: 10,
      allowedTokens: ['USDC'],
      swapsEnabled: false,
    },
  });

  console.log(`Wallet created at: ${wallet.address}`);
  console.log('Initial policies:', wallet.policies);

  // Listen for policy updates
  wallet.on('policy:updated', (event) => {
    console.log('\n[Event] Policy updated:', event.policy);
  });

  // The owner decides to increase limits after gaining confidence
  console.log('\nUpdating policies (owner action)...');
  const receipt = await wallet.updatePolicies({
    dailyLimit: 1000,           // Increase from $100 to $1,000
    perTransactionLimit: 200,   // Increase from $20 to $200
    approvalThreshold: 100,     // Increase from $10 to $100
    allowedTokens: ['USDC', 'USDT'], // Allow USDT too
    swapsEnabled: true,         // Enable swaps
  });

  console.log(`Policy update tx: ${receipt.txHash} (${receipt.status})`);
  console.log('Updated policies:', wallet.policies);
}

// -------------------------------------------------------
// Run both parts
// -------------------------------------------------------
async function main() {
  // Part 1 runs locally — no blockchain needed
  demonstratePolicyValidation();

  // Part 2 requires env vars and testnet ETH — skip if not configured
  if (process.env.OWNER_PRIVATE_KEY && process.env.AGENT_PRIVATE_KEY) {
    await demonstratePolicyUpdate();
  } else {
    console.log('\n\nSkipping Part 2 (on-chain demo). Set OWNER_PRIVATE_KEY and AGENT_PRIVATE_KEY to run it.');
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
