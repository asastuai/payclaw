<div align="center">

# PayClaw

### Give your AI agent a wallet.

Open-source SDK for AI agent payments with programmable rules and human oversight.

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-24%20passing-brightgreen.svg)](#development)
[![Security](https://img.shields.io/badge/security-audited-brightgreen.svg)](SECURITY_AUDIT.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.26-363636.svg)](https://soliditylang.org/)
[![Base Sepolia](https://img.shields.io/badge/Base%20Sepolia-deployed-0052FF.svg)](https://sepolia.basescan.org/address/0x311CBD67E108870f4Ce12a6FaDf6eab6197d53a0)
[![BSC](https://img.shields.io/badge/BSC-planned-F0B90B.svg)](https://www.bnbchain.org/)
[![Solana](https://img.shields.io/badge/Solana-planned-9945FF.svg)](https://solana.com)

[Quickstart](#quickstart) · [Playground](https://payclaw.dev/playground) · [Docs](https://payclaw.dev/docs) · [Dashboard](https://payclaw.dev)

</div>

---

## The Problem

AI agents can think, plan, and execute — but they can't pay for anything. When your agent needs to buy an API call, pay a supplier, or process a refund, it stops and waits for a human.

**PayClaw fixes this.** One SDK. Ten lines of code. Your agent gets a wallet with rules you control.

## Quickstart

```bash
npm install @payclaw/sdk
```

```typescript
import { PayClaw } from '@payclaw/sdk';

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
| Factory | [`0x311CBD67...`](https://sepolia.basescan.org/address/0x311CBD67E108870f4Ce12a6FaDf6eab6197d53a0) |
| PolicyRegistry | [`0xdd431B14...`](https://sepolia.basescan.org/address/0xdd431B147e4D39cccAe587f634f4356f455977c4) |
| ApprovalQueue | [`0xBFC5Eb54...`](https://sepolia.basescan.org/address/0xBFC5Eb54A57cA2CCa4E070861E4B898D14884542) |

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
- [ ] npm publish (`@payclaw/sdk`)
- [ ] Contract verification on BaseScan
- [ ] Solana program implementation
- [ ] Dashboard MVP (wallet management + approvals)
- [ ] Interactive playground with live testnet
- [ ] BSC testnet deployment
- [ ] Mainnet deployment

## Why PayClaw?

McKinsey projects **$3-5 trillion** in agentic commerce by 2030. Google, Stripe, and Mastercard are building enterprise solutions for agent payments. But there's nothing for indie developers.

**PayClaw is the open-source alternative.** No enterprise contracts. No sales calls. Just `npm install` and your agent can pay.

## License

Apache 2.0 — use it for anything. Patent protection included.

---

<div align="center">

**Built by [asastuai](https://github.com/asastuai) from Buenos Aires 🇦🇷**

</div>
