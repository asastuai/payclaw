<div align="center">

# PayClaw

### Agent wallet SDK with programmable rules, human oversight, and PoC-gated release conditions.

[![npm](https://img.shields.io/npm/v/payclaw-ai.svg)](https://www.npmjs.com/package/payclaw-ai)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Foundry tests](https://img.shields.io/badge/Foundry%20tests-24%20passing-brightgreen.svg)](#tests)
[![SDK tests](https://img.shields.io/badge/SDK%20tests-10%20passing-brightgreen.svg)](#tests)
[![Security](https://img.shields.io/badge/security-audited-brightgreen.svg)](SECURITY_AUDIT.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.26-363636.svg)](https://soliditylang.org/)
[![Base Sepolia](https://img.shields.io/badge/Base%20Sepolia-verified-0052FF.svg)](https://sepolia.basescan.org/address/0x86AA9e4B4A1B25250625146654cf8088b6053F5D)

*Part of [**Aletheia**](https://github.com/asastuai/aletheia). Full stack for the agentic economics.*

[Quickstart](#quickstart) · [PoC Integration](#proof-of-context-integration) · [Security Audit](SECURITY_AUDIT.md) · [Examples](examples/) · [npm](https://www.npmjs.com/package/payclaw-ai)

</div>

---

## The Problem

AI agents can already pay. Protocols like [x402](https://x402.org) solved the payment rail — agents make HTTP requests, pay in stablecoins, get the resource. That works.

**What doesn't exist is the control layer.** When your agent can pay autonomously, who sets the limits? Who approves large transactions? What stops a compromised agent from draining the wallet?

x402 is Visa — the rail that moves money. **PayClaw is the corporate expense system** — who can spend what, how much, to whom, and when they need human approval. All enforced on-chain by smart contracts, not application code.

## Quickstart

```bash
npm install payclaw-ai
```

```typescript
import { PayClaw } from 'payclaw-ai';

const payclaw = new PayClaw({ chain: 'base' });

const wallet = await payclaw.createWallet({
  ownerPrivateKey: '0x...',       // you control the rules
  agentPrivateKey: '0x...',       // agent operates within them
  policies: {
    dailyLimit: 1000,             // $1,000/day max
    perTransactionLimit: 100,     // $100 max per tx
    approvalThreshold: 50,        // above $50 → needs your OK
    allowedTokens: ['USDC'],
  },
});

// agent pays autonomously (within limits)
await wallet.pay({
  to: '0xMerchant...',
  token: 'USDC',
  amount: 25.50,
  memo: 'Invoice #1234',
});
```

That's it. The agent operates. You stay in control.

---

## ◊ Proof-of-Context Integration

PayClaw includes a Proof-of-Context (PoC) verification helper. Lets agents verify a counterparty's freshness commitment before paying for stale data.

```typescript
import { PayClaw, verifyPocCommitment } from 'payclaw-ai';

const data = await fetch('https://baseoracle.example/api/v1/prices?token=ETH').then(r => r.json());

const verdict = await verifyPocCommitment(data, {
  expectedPublicKey: BASEORACLE_OPERATOR_PUBKEY,
  maxAgeSeconds: 30,
});

if (!verdict.valid) {
  throw new Error(`Refusing payment: ${verdict.reason}`);
}

await wallet.pay({
  to: '0xBaseOracleOperator',
  token: 'USDC',
  amount: 0.001,
  memo: `PoC ts=${verdict.poc.timestamp}`,
});
```

What `verifyPocCommitment` checks (in order):

- `_poc` block is present.
- Signature exists (or `allowUnsigned: true` opts in to development mode).
- Age does not exceed `maxAgeSeconds` (or operator's declared horizon).
- Re-computed payload hash matches the attested hash (tampering detection).
- Ed25519 signature verifies against the canonical signing message.
- Public key matches `expectedPublicKey` when pinned (operator identity).

Each failure returns a structured `PocVerdict` with `reason` set, so the caller can distinguish `stale` from `payload_hash_mismatch` from `operator_mismatch`.

This is the **SDK-side enforcement** of the PoC release condition. On-chain enforcement is wired in two phases. **Phase 7a** ships the verifier contract `PoCVerifier.sol` (12 Foundry tests passing). **Phase 7b** wires `PolicyRegistry × PoCVerifier` so that policy evaluation can call `PoCVerifier.isFresh` as part of `checkTransactionWithPoC` (15 additional tests passing, opt-in per wallet via `setPocRequired`). **AgentWallet routing** through `checkTransactionWithPoC` is **planned (Phase 7c)** — at the time of this commit AgentWallet itself still calls the legacy `checkTransaction` method. Integrators consuming the policy contract directly can use the PoC-aware variant today; agent flows that route through the wallet will pick it up in Phase 7c.

Reference primitive: [proof-of-context-impl](https://github.com/asastuai/proof-of-context-impl). Position paper: [proof-of-context](https://github.com/asastuai/proof-of-context).

Full example: [`examples/poc-gated-payment.ts`](examples/poc-gated-payment.ts).

---

## How It Works

```
┌─────────────┐         ┌──────────────┐         ┌────────────────┐
│   AI Agent   │────────▶│  PayClaw SDK │────────▶│  Smart Contract│
│  (your code) │         │  (npm pkg)   │         │  (on-chain)    │
└─────────────┘         └──────┬───────┘         └───────┬────────┘
                               │                         │
                               │  policy check           │  execute or queue
                               │                         │
                        ┌──────▼───────┐         ┌───────▼────────┐
                        │Policy Engine │         │ Approval Queue │
                        │ (on-chain)   │         │ (if > threshold)│
                        └──────────────┘         └───────┬────────┘
                                                         │
                                                  ┌──────▼───────┐
                                                  │  Human Owner │
                                                  │  (dashboard) │
                                                  └──────────────┘
```

**Every transaction goes through the Policy Engine.** If the agent tries to exceed its limits, the contract reverts. If the amount needs approval, it queues for the human. The agent cannot bypass this — it's enforced on-chain.

## Features

### For Developers
- **10-line integration** — `npm install` and go
- **Multi-chain** — Base L2, BSC, and Solana from a single API
- **TypeScript-first** — full type safety, IntelliSense, JSDoc
- **Event system** — subscribe to payments, approvals, policy changes
- **Gasless** — agents don't need ETH (ERC-4337 + Paymaster)

### For Security
- **On-chain policy enforcement** — daily limits, per-tx limits, token allowlists, recipient allowlists, cooldowns
- **Human approval flow** — transactions above threshold queue for owner approval
- **Emergency withdraw** — owner can pull all funds instantly
- **Agent revocation** — disable the agent with one call
- **Non-upgradeable contracts** — immutable by design
- **Reentrancy protection** — all state-changing functions are guarded

### Policy Engine

| Rule | Enforced | Default |
|------|----------|---------|
| Daily spending limit (USD) | On-chain | $1,000 |
| Per-transaction limit | On-chain | $100 |
| Approval threshold | On-chain | $50 |
| Token allowlist | On-chain | All tokens |
| Recipient allowlist | On-chain | Anyone |
| Swap controls | On-chain | Enabled |
| DEX router allowlist | On-chain | Default routers |
| Cooldown between transactions | On-chain | None |

## Architecture

```
payclaw/
├── packages/
│   ├── sdk/                    # @payclaw/sdk — the npm package
│   ├── contracts-evm/          # Solidity smart contracts (Foundry)
│   ├── contracts-solana/       # Anchor programs (Rust)
│   └── shared/                 # Shared types and constants
├── apps/
│   ├── dashboard/              # Next.js — human oversight UI
│   ├── playground/             # Interactive sandbox
│   └── docs/                   # Documentation site
```

### Smart Contracts (EVM)

| Contract | Purpose |
|----------|---------|
| `AgentWallet` | ERC-4337 smart account — holds funds, executes payments |
| `AgentWalletFactory` | CREATE2 deterministic deployment of wallet clones |
| `PolicyRegistry` | On-chain rules engine — checks every transaction |
| `ApprovalQueue` | Pending transactions waiting for human approval |

**24 Foundry tests** (16 unit + 5 fuzz + 3 invariant) covering: payments, limits, approvals, batch operations, emergency withdrawals, access control, daily reset, and 38,400 random call sequences.

**[Security audited](SECURITY_AUDIT.md)** — 3 critical + 4 high findings identified and fixed.

## Use Cases

**Customer support agent** — processes refunds within policy limits, escalates large amounts to humans.

**Trading bot** — operates within daily limits and approved tokens. Can't drain the wallet even if compromised.

**Subscription manager** — handles recurring payments to approved recipients only.

**Multi-agent systems** — agents pay each other for services. Microtransactions settled on-chain in seconds.

**Procurement agent** — buys supplies from approved vendors, queues large purchases for approval.

## Tests

```bash
# SDK tests (PoC verification helper, 10 tests)
cd packages/sdk && pnpm test

# Contract tests (24 Foundry tests: 16 unit + 5 fuzz + 3 invariant)
cd packages/contracts-evm && forge test
```

## Development

```bash
# install dependencies
pnpm install

# build everything
pnpm build

# run dashboard locally
pnpm --filter @payclaw/dashboard dev
```

## Deployed Contracts (Base Sepolia)

| Contract | Address |
|----------|---------|
| Factory | [`0x86AA9e4B...`](https://sepolia.basescan.org/address/0x86AA9e4B4A1B25250625146654cf8088b6053F5D) |
| PolicyRegistry | [`0x8eFd0F8C...`](https://sepolia.basescan.org/address/0x8eFd0F8C22be60DB1eb21fb9BfA316C192c76C13) |
| ApprovalQueue | [`0xCBF434A8...`](https://sepolia.basescan.org/address/0xCBF434A8D9fC47C0FCc9B77dda28e6Fe44a04448) |
| AgentWallet (impl) | [`0x69dBdf8e...`](https://sepolia.basescan.org/address/0x69dBdf8e096c8666BDE270A506447B619Cc5D28D) |

## Roadmap

- [x] Smart contracts (EVM) — AgentWallet, Factory, PolicyRegistry, ApprovalQueue
- [x] 24 tests passing (16 unit + 5 fuzz + 3 invariant)
- [x] Security audit — 7 findings fixed ([report](SECURITY_AUDIT.md))
- [x] TypeScript SDK with viem — full contract integration
- [x] Deploy to Base Sepolia testnet
- [x] End-to-end integration test on live testnet
- [x] Documentation — 13 pages (concepts, API reference, guides)
- [x] JSDoc + NatSpec — full API documentation
- [x] Working examples (basic payment, policies, approvals, PoC-gated payment)
- [x] Dashboard scaffold (Next.js)
- [x] Playground scaffold
- [x] npm publish ([`payclaw-ai`](https://www.npmjs.com/package/payclaw-ai))
- [x] Contract verification on BaseScan
- [x] **PoC verification helper in SDK** (10 tests passing)
- [x] On-chain `IPoCVerifier` contract (Phase 7a, 12 Foundry tests)
- [x] `PolicyRegistry × PoCVerifier` integration (Phase 7b, 15 Foundry tests, opt-in per wallet)
- [ ] AgentWallet routing through `checkTransactionWithPoC` (Phase 7c, pending)
- [ ] Solana program implementation
- [ ] Dashboard MVP (wallet management + approvals)
- [ ] Interactive playground with live testnet
- [ ] BSC testnet deployment
- [ ] Mainnet deployment

## Why PayClaw?

McKinsey projects **$3-5 trillion** in agentic commerce by 2030. Google, Stripe, and Mastercard are building enterprise solutions for agent payments. But there's nothing for indie developers.

**PayClaw is the open-source alternative.** No enterprise contracts. No sales calls. Just `npm install` and your agent can pay.

## ❖ Part of Aletheia

PayClaw is the agent wallet layer of [**Aletheia**](https://github.com/asastuai/aletheia). Five sibling repos compose the rest of the stack.

- [**Proof-of-Context**](https://github.com/asastuai/proof-of-context) — verification spine. The primitive PayClaw's verification helper checks against.
- [**proof-of-context-impl**](https://github.com/asastuai/proof-of-context-impl) — Rust reference implementation of PoC.
- [**SUR Protocol**](https://github.com/asastuai/sur-protocol) — perp DEX. Consumer of PayClaw wallets for agent trading custody.
- [**TrustLayer**](https://github.com/asastuai/TrustLayer) — agent reputation. Uses PayClaw escrow as one of its four primitives.
- [**BaseOracle**](https://github.com/asastuai/BaseOracle) — pay-per-query data. Recipient of PayClaw-controlled USDC payments. Producer of `f_i` PoC commitments PayClaw can verify.
- [**Vigil**](https://github.com/asastuai/vigil) — DeFi intelligence. Same recipient + producer pattern.

## License

Apache 2.0. Patent protection included.

---

Built by [Juan Cruz Maisú](https://github.com/asastuai). Buenos Aires, Argentina.

Juan Cruz Maisú ♥
