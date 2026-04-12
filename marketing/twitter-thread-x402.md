# Twitter Thread — PayClaw vs x402 positioning

## Tweet 1 (hook)
"AI agents can already pay. That problem is solved.

The real problem? They have no limits.

x402 lets agents pay. PayClaw controls HOW MUCH they can pay, to whom, and when they need human approval.

Here's the difference 🧵"

## Tweet 2 (explain x402)
"x402 (by @coinbase + @cloudaboreja) revived the HTTP 402 status code.

Agent requests an API → server says 'pay $0.01 USDC' → agent pays → gets the resource.

75M transactions last month. It works. It's brilliant.

But it's a payment RAIL, not a payment CONTROLLER."

## Tweet 3 (the gap)
"Here's what x402 doesn't do:

❌ No spending limits (agent can drain the wallet)
❌ No human approval for large amounts
❌ No token or recipient allowlists
❌ No daily caps
❌ No wallet creation or management

It assumes someone else handles all of that. Nobody does."

## Tweet 4 (the analogy)
"Think of it this way:

x402 = Visa (the rail that moves money from A to B)
PayClaw = the corporate expense system (who can spend what, how much, with whose approval)

You wouldn't give an employee a Visa card with no limit and no oversight. Same logic applies to AI agents."

## Tweet 5 (how they work together)
"PayClaw sits on top of x402, not against it.

Agent wants to pay $50 via x402:
→ PayClaw checks: within daily limit? ✅
→ Token allowed? ✅
→ Needs approval? No, under threshold ✅
→ PayClaw authorizes → x402 settles

Without PayClaw, that same agent could spend $10,000/hour with zero guardrails."

## Tweet 6 (what PayClaw enforces)
"What PayClaw enforces ON-CHAIN (not in the app layer):

• $X/day spending cap
• $Y max per transaction
• Human approval above $Z
• Only approved tokens (USDC, USDT)
• Only approved recipients
• Cooldown between transactions

Smart contracts enforce this. Not the SDK. Can't be bypassed."

## Tweet 7 (the stack)
"The emerging stack for agentic payments:

Layer 1: x402 — payment transport (HTTP-native)
Layer 2: Identity — who is this agent? (ACP, AP2)
Layer 3: PayClaw — spending control + policy enforcement
Layer 4: Application — your agent doing its job

We're building Layer 3. It didn't exist."

## Tweet 8 (CTA)
"PayClaw is open source and live on Base Sepolia:

→ github.com/asastuai/payclaw
→ npm install payclaw-ai
→ Contracts verified on BaseScan
→ 24 tests + security audit

x402 solved the rail. We're solving the control.

Built solo from Buenos Aires."
