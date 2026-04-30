/**
 * Example: PoC-gated payment
 * ===========================
 *
 * The agent fetches data from a Proof-of-Context-attested source (BaseOracle,
 * Vigil, or any other PoC producer), verifies the operator's freshness
 * commitment off-chain via the SDK helper, and only submits the payment when
 * the commitment passes.
 *
 * If the commitment is stale, tampered, or signed by the wrong operator,
 * the payment never goes through. The agent does not pay for blind data.
 *
 * This is the SDK-side enforcement of the "PoC release condition" pattern.
 * On-chain enforcement (a Solidity policy hook in PolicyRegistry that calls
 * into a verifier contract) is the next phase.
 *
 * Reference primitive: github.com/asastuai/proof-of-context-impl
 * Position paper:      github.com/asastuai/proof-of-context
 */

import { PayClaw, verifyPocCommitment, type PocBlock } from 'payclaw-ai';

// 1. Set up the wallet (assumes wallet is already created — see basic-payment.ts).
const payclaw = new PayClaw({ chain: 'base' });
const wallet = await payclaw.loadWallet({
  address: '0xYourAgentWalletAddress',
  agentPrivateKey: process.env.AGENT_PRIVATE_KEY!,
});

// 2. Fetch attested data from a PoC producer.
//    Here we hit a hypothetical BaseOracle endpoint that returns a price
//    plus a `_poc` block.
const oracleResponse = await fetch(
  'https://baseoracle.example/api/v1/prices?token=ETH'
);
const data = (await oracleResponse.json()) as Record<string, unknown> & {
  _poc?: PocBlock;
};

// 3. Verify the PoC commitment off-chain.
//    `expectedPublicKey` should be the operator's known key, fetched once
//    from /api/v1/poc/public-key and pinned in your config.
const verdict = await verifyPocCommitment(data, {
  expectedPublicKey: process.env.BASEORACLE_OPERATOR_PUBKEY!,
  maxAgeSeconds: 30, // Tighter than what the operator declared.
});

if (!verdict.valid) {
  console.error(`Refusing payment: ${verdict.reason}`);
  console.error(`Stale data is not worth paying for.`);
  process.exit(1);
}

console.log(
  `PoC commitment verified. Operator vouched for freshness ${verdict.ageSeconds!.toFixed(
    1
  )}s ago.`
);

// 4. Only now submit the payment for the consumed data.
//    The agent's payment is gated on the upstream commitment being fresh.
//    Stale data does not result in a paid query.
const receipt = await wallet.pay({
  to: '0xBaseOracleOperatorWallet',
  token: 'USDC',
  amount: 0.001, // $0.001 USDC for the price query.
  memo: `BaseOracle ETH query, PoC ts=${verdict.poc!.timestamp}`,
});

console.log(`Paid. Tx: ${receipt.txHash}`);
