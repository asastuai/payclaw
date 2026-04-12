# Hacker News — Show HN Post

## Title
Show HN: PayClaw — Open-source SDK for AI agent payments with on-chain spending limits

## URL
https://github.com/asastuai/payclaw

## Text (for "text" field — only if doing a text post instead of URL)

I built PayClaw because every AI agent wallet solution I found has the same problem: they give agents full access to a wallet with zero guardrails.

PayClaw is different. It's a TypeScript SDK + Solidity smart contracts that let you give an AI agent a wallet with programmable rules:

- Daily spending limits ($X/day)
- Per-transaction limits ($Y max per tx)
- Approval threshold (above $Z, queue for human approval)
- Token allowlists (only USDC, for example)
- Recipient allowlists (only approved vendors)

The key difference: these rules are enforced ON-CHAIN by smart contracts, not in the SDK. Even if the agent is compromised or the SDK has a bug, the contracts enforce the limits. The agent literally cannot exceed them.

Quick start:

    npm install payclaw-ai

    const wallet = await payclaw.createWallet({
      policies: { dailyLimit: 1000, approvalThreshold: 50 }
    });
    
    await wallet.pay({ to: '0x...', token: 'USDC', amount: 25 });

What's live:
- 4 smart contracts deployed and verified on Base Sepolia
- 24 Foundry tests (16 unit + 5 fuzz + 3 invariant with 38,400 random calls)
- Security audit with 7 findings fixed
- TypeScript SDK published on npm
- Multi-chain support: Base L2, BSC, Solana

Stack: Solidity (Foundry), TypeScript, viem, Next.js, ERC-4337

I'm a solo builder from Buenos Aires. This is Apache 2.0 licensed. Feedback welcome.

GitHub: https://github.com/asastuai/payclaw
npm: https://www.npmjs.com/package/payclaw-ai
Security audit: https://github.com/asastuai/payclaw/blob/main/SECURITY_AUDIT.md
