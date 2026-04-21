<div align="center">

# PayClaw

### Give your AI agent a wallet.

Open-source SDK for AI agent payments with programmable rules and human oversight.

[![npm](https://img.shields.io/npm/v/payclaw-ai.svg)](https://www.npmjs.com/package/payclaw-ai)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-24%20passing-brightgreen.svg)](#development)
[![Security](https://img.shields.io/badge/security-audited-brightgreen.svg)](SECURITY_AUDIT.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.26-363636.svg)](https://soliditylang.org/)
[![Base Sepolia](https://img.shields.io/badge/Base%20Sepolia-verified-0052FF.svg)](https://sepolia.basescan.org/address/0x86AA9e4B4A1B25250625146654cf8088b6053F5D)
[![BSC](https://img.shields.io/badge/BSC-planned-F0B90B.svg)](https://www.bnbchain.org/)
[![Solana](https://img.shields.io/badge/Solana-planned-9945FF.svg)](https://solana.com)

[Quickstart](#quickstart) · [Security Audit](SECURITY_AUDIT.md) · [Examples](examples/) · [npm](https://www.npmjs.com/package/payclaw-ai)

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

## Development

```bash
# install dependencies
pnpm install

# build everything
pnpm build

# run contract tests
cd packages/contracts-evm && forge test

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
- [x] Working examples (basic payment, policies, approvals)
- [x] Dashboard scaffold (Next.js)
- [x] Playground scaffold
- [x] npm publish ([`payclaw-ai`](https://www.npmjs.com/package/payclaw-ai))
- [x] Contract verification on BaseScan
- [ ] Solana program implementation
- [ ] Dashboard MVP (wallet management + approvals)
- [ ] Interactive playground with live testnet
- [ ] BSC testnet deployment
- [ ] Mainnet deployment

## Why PayClaw?

McKinsey projects **$3-5 trillion** in agentic commerce by 2030. Google, Stripe, and Mastercard are building enterprise solutions for agent payments. But there's nothing for indie developers.

**PayClaw is the open-source alternative.** No enterprise contracts. No sales calls. Just `npm install` and your agent can pay.

## Related agent-infra repositories

PayClaw is the **control layer** of a small stack of agent-native primitives:

- [**PayClaw**](https://github.com/asastuai/payclaw) — *(this repo)* — agent wallet SDK with programmable rules
- [**BaseOracle**](https://github.com/asastuai/BaseOracle) — pay-per-query data feeds for agents (x402)
- [**TrustLayer**](https://github.com/asastuai/TrustLayer) — trust infrastructure: skill audit, test harness, SLA monitor, escrow

PayClaw + BaseOracle + TrustLayer together give an agent everything it needs to transact safely with unfamiliar counterparties: money rails, market data, and verifiable trust.

## License

Apache 2.0 — use it for anything. Patent protection included.

---

<div align="center">

**Built by [asastuai](https://github.com/asastuai) from Buenos Aires 🇦🇷**

</div>
