# Twitter/X Thread — PayClaw Launch

## Tweet 1 (hook)
AI agents can think, plan, and execute.

But they can't pay for anything.

I just open-sourced PayClaw — an SDK that gives your AI agent a wallet with spending rules enforced on-chain.

npm install payclaw-ai

Here's why this matters 🧵

## Tweet 2 (the problem)
Every "agent wallet" solution today works the same way:

Give the agent a wallet → hope for the best.

No spending limits. No approval flows. No safety net.

That's like giving your new employee your personal credit card with no limit.

## Tweet 3 (the solution)
PayClaw flips this:

You define the rules → the agent operates within them → smart contracts ENFORCE the rules.

- $1,000/day max
- $100 per transaction
- Above $50 needs your approval
- Only USDC allowed
- Specific recipients only

The agent literally cannot break these rules. It's on-chain.

## Tweet 4 (code)
10 lines of TypeScript. That's it.

```
const wallet = await payclaw.createWallet({
  policies: {
    dailyLimit: 1000,
    perTransactionLimit: 100,
    approvalThreshold: 50,
    allowedTokens: ['USDC'],
  },
});

await wallet.pay({ to: '0x...', token: 'USDC', amount: 25 });
```

## Tweet 5 (what's different)
How is this different from Coinbase AgentKit, Circle, or Stripe?

- Policy engine is ON-CHAIN (not in the SDK — can't be bypassed)
- Human approval flow for large transactions
- Fully open source (Apache 2.0)
- Multi-chain: Base, BSC, Solana
- npm install, not a sales call

## Tweet 6 (what's built)
What's live right now:

✅ 4 smart contracts deployed + verified on Base Sepolia
✅ 24 tests (unit + fuzz + invariant)
✅ Security audit — 7 findings fixed
✅ TypeScript SDK on npm
✅ Documentation (13 pages)
✅ Dashboard + Playground scaffolds

## Tweet 7 (why now)
McKinsey projects $3-5 trillion in agentic commerce by 2030.

140 million agent payments happened in 2025.

Google, Stripe, and Mastercard are building enterprise solutions.

But there's nothing for indie developers. Until now.

## Tweet 8 (CTA)
PayClaw is open source and live:

→ GitHub: github.com/asastuai/payclaw
→ npm: npmjs.com/package/payclaw-ai
→ Contracts: verified on BaseScan

Star the repo if you think AI agents need better financial rails.

Built solo from Buenos Aires 🇦🇷
