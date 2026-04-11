import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Spending Limits",
  description: "How to configure spending limit profiles for different agent use cases.",
};

function CodeBlock({ code, lang = "typescript" }: { code: string; lang?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-3 overflow-hidden mb-4">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="font-mono text-xs text-muted">{lang}</span>
      </div>
      <pre className="font-mono text-sm p-4 overflow-x-auto text-[#e0e0e0]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function SpendingLimitsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-12">
        <div className="flex items-center gap-2 text-xs font-mono text-muted mb-4">
          <Link href="/" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <Link href="/guides/spending-limits" className="hover:text-white transition-colors">Guides</Link>
          <span>/</span>
          <span className="text-accent">Spending Limits</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Spending Limits</h1>
        <p className="text-lg text-[#999] leading-relaxed">
          Configure limit profiles matched to your agent&apos;s risk level and use case.
        </p>
      </div>

      <div className="prose">
        <h2>How limits work</h2>
        <p>
          PayClaw enforces three layers of spending control, all on-chain:
        </p>
        <ul>
          <li><strong>Per-transaction limit</strong> &mdash; maximum USD value for a single <code>pay()</code> or <code>swap()</code></li>
          <li><strong>Daily limit</strong> &mdash; total USD the agent can spend in a 24-hour window</li>
          <li><strong>Approval threshold</strong> &mdash; transactions above this amount queue for human approval (but still count toward the daily limit)</li>
        </ul>
        <p>
          If a transaction would exceed the per-transaction or daily limit, the contract
          reverts. There is no approval queue for over-limit transactions &mdash; they are
          simply blocked.
        </p>

        <h2>Use case: Customer support bot</h2>
        <p>
          Processes refunds for low-value orders. Only USDC to known customer wallets.
          Every refund above $10 needs manager approval.
        </p>
        <CodeBlock code={`const wallet = await payclaw.createWallet({
  ownerPrivateKey: process.env.OWNER_KEY!,
  agentPrivateKey: process.env.AGENT_KEY!,
  policies: {
    dailyLimit: 200,              // $200/day total refund budget
    perTransactionLimit: 50,      // no single refund over $50
    approvalThreshold: 10,        // manager approves above $10
    allowedTokens: ["USDC"],      // only stablecoins
    allowedRecipients: [],        // any recipient (customer wallets)
    swapsEnabled: false,          // no need for swaps
    cooldownSeconds: 30,          // 30s between refunds
  },
});`} />

        <h2>Use case: Trading bot</h2>
        <p>
          Executes trades on DEXes within a daily budget. Needs to swap tokens
          and move fast, so approval threshold is high and cooldown is off.
        </p>
        <CodeBlock code={`const wallet = await payclaw.createWallet({
  ownerPrivateKey: process.env.OWNER_KEY!,
  agentPrivateKey: process.env.AGENT_KEY!,
  policies: {
    dailyLimit: 5000,             // $5K/day trading budget
    perTransactionLimit: 1000,    // max $1K per swap
    approvalThreshold: 500,       // only flag large trades
    allowedTokens: ["USDC", "WETH", "WBTC"],
    swapsEnabled: true,
    allowedRouters: [],           // use default routers
    cooldownSeconds: 0,           // no cooldown — speed matters
  },
});`} />

        <h2>Use case: Subscription manager</h2>
        <p>
          Pays recurring invoices to a known set of vendors. Strict recipient allowlist
          and predictable daily spend.
        </p>
        <CodeBlock code={`const wallet = await payclaw.createWallet({
  ownerPrivateKey: process.env.OWNER_KEY!,
  agentPrivateKey: process.env.AGENT_KEY!,
  policies: {
    dailyLimit: 500,
    perTransactionLimit: 100,
    approvalThreshold: 50,
    allowedTokens: ["USDC"],
    allowedRecipients: [
      "0xOpenAI...",               // known vendors only
      "0xAWS...",
      "0xVercel...",
    ],
    swapsEnabled: false,
    cooldownSeconds: 0,
  },
});`} />

        <h2>Use case: Micro-payments agent</h2>
        <p>
          Handles high-frequency, low-value transactions (API calls, data feeds, tips).
          Very low per-tx limit but high daily volume.
        </p>
        <CodeBlock code={`const wallet = await payclaw.createWallet({
  ownerPrivateKey: process.env.OWNER_KEY!,
  agentPrivateKey: process.env.AGENT_KEY!,
  policies: {
    dailyLimit: 100,              // $100/day budget
    perTransactionLimit: 1,       // max $1 per tx
    approvalThreshold: 1,         // no approvals needed (max = threshold)
    allowedTokens: ["USDC"],
    swapsEnabled: false,
    cooldownSeconds: 5,           // rate limit: 1 tx per 5 seconds
  },
});`} />

        <h2>Monitoring limits at runtime</h2>
        <p>
          Check how much budget the agent has left before sending a transaction:
        </p>
        <CodeBlock code={`const limits = await wallet.getRemainingLimits();

console.log("Daily budget:", limits.dailyLimit);
console.log("Spent so far:", limits.dailySpent);
console.log("Remaining:", limits.dailyRemaining);
console.log("Per-tx max:", limits.perTransactionLimit);
console.log("Next reset:", limits.nextResetAt);

// Your agent logic:
if (limits.dailyRemaining < paymentAmount) {
  console.log("Insufficient daily budget, waiting for reset.");
  return;
}`} />

        <h2>Updating limits dynamically</h2>
        <p>
          Adjust limits based on trust level, time of day, or business rules:
        </p>
        <CodeBlock code={`// Start conservative, increase after gaining trust
await wallet.updatePolicies({
  dailyLimit: 2000,              // doubled from 1000
  perTransactionLimit: 200,      // doubled from 100
  approvalThreshold: 100,        // raised from 50
});

// Tighten during off-hours
await wallet.updatePolicies({
  dailyLimit: 100,
  perTransactionLimit: 25,
  approvalThreshold: 10,
});`} />

        <h2>Daily limit reset behavior</h2>
        <p>
          The daily spending counter resets 24 hours after the last reset, not at
          midnight. This means the reset time shifts based on when the wallet was first
          used.
        </p>
        <div className="rounded-lg border border-[#ffcc66]/20 bg-[#ffcc66]/5 px-4 py-3 text-sm text-[#ffcc66] mb-4 not-prose">
          <strong className="font-semibold">Known limitation:</strong> An agent can spend
          up to 2x the daily limit in a short window if it spends the full limit just before
          a reset, then again just after. Set the per-transaction limit lower than the daily
          limit to reduce the blast radius. For high-value wallets, use a lower approval
          threshold as an additional safety net.
        </div>
      </div>

      <div className="border-t border-border pt-10 mt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/concepts/policies"
            className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-4 hover:border-[#333] hover:bg-surface-3 transition-colors group"
          >
            <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
              Policies Reference &rarr;
            </span>
            <span className="text-xs text-muted">Full rules table and validation order</span>
          </Link>
          <Link
            href="/guides/human-approval"
            className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-4 hover:border-[#333] hover:bg-surface-3 transition-colors group"
          >
            <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
              Human Approval &rarr;
            </span>
            <span className="text-xs text-muted">Set up the approval flow</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
