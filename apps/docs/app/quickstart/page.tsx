import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Quickstart",
  description: "Get started with PayClaw in under 5 minutes.",
};

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex gap-6">
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 font-mono text-sm font-bold text-accent">
          {n}
        </div>
        <div className="mt-2 flex-1 w-px bg-border" />
      </div>
      <div className="pb-12 min-w-0 w-full">
        <h2 className="text-lg font-semibold text-white mb-3">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
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

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#ffcc66]/20 bg-[#ffcc66]/5 px-4 py-3 text-sm text-[#ffcc66] mb-4">
      {children}
    </div>
  );
}

const installCode = `npm install @payclaw/sdk
# or
pnpm add @payclaw/sdk
# or
yarn add @payclaw/sdk`;

const initCode = `import { PayClaw } from "@payclaw/sdk";

// 1. Initialize the SDK with your target chain
const payclaw = new PayClaw({
  chain: "base-sepolia",  // testnet for development
});

// 2. Create a wallet with policies
const wallet = await payclaw.createWallet({
  ownerPrivateKey: process.env.OWNER_PRIVATE_KEY!,
  agentPrivateKey: process.env.AGENT_PRIVATE_KEY!,
  policies: {
    dailyLimit: 500,              // $500/day max spend
    perTransactionLimit: 100,     // $100 max per transaction
    approvalThreshold: 50,        // human approval required above $50
    allowedTokens: ["USDC"],      // restrict to USDC only
    cooldownSeconds: 0,           // no cooldown between txs
  },
});

console.log("Wallet created:", wallet.address);
console.log("Chain:", wallet.chain);
console.log("Policies:", wallet.policies);`;

const payCode = `// Agent makes a payment — policy engine validates automatically
const tx = await wallet.pay({
  to: "0x1234567890abcdef1234567890abcdef12345678",
  token: "USDC",
  amount: 25.50,
  memo: "API subscription - invoice #1234",
});

console.log("Tx hash:", tx.txHash);
console.log("Status:", tx.status);  // "success" | "pending" | "failed"
console.log("Gas used:", tx.gasUsed);

// If amount > approvalThreshold, status will be "pending"
// and the tx enters the approval queue for the owner to review.

// Check remaining limits after the payment
const limits = await wallet.getRemainingLimits();
console.log("Daily remaining:", limits.dailyRemaining);
console.log("Resets at:", limits.nextResetAt);`;

export default function QuickstartPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-2 text-xs font-mono text-muted mb-4">
          <Link href="/" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <span className="text-accent">Quickstart</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Quickstart</h1>
        <p className="text-lg text-[#999] leading-relaxed">
          Get your first AI agent wallet running in under 5 minutes.
        </p>
      </div>

      {/* Steps */}
      <div>
        {/* Step 1 */}
        <Step n={1} title="Install the SDK">
          <CodeBlock code={installCode} lang="bash" />
          <p className="text-sm text-[#888] leading-relaxed">
            The SDK is framework-agnostic and works with Node.js, Bun, and edge runtimes.
            It requires TypeScript 5.0+ for full type safety.
          </p>
        </Step>

        {/* Step 2 */}
        <Step n={2} title="Initialize and create a wallet">
          <CodeBlock code={initCode} lang="typescript" />
          <Note>
            <strong className="font-semibold">Security:</strong> Never hardcode private keys.
            Store <code className="font-mono bg-surface px-1 rounded">OWNER_PRIVATE_KEY</code> and{" "}
            <code className="font-mono bg-surface px-1 rounded">AGENT_PRIVATE_KEY</code> in
            environment variables. The owner key controls policy and approvals; the agent key
            can only operate within the policy constraints.
          </Note>
          <p className="text-sm text-[#888] leading-relaxed">
            The wallet is an ERC-4337 smart account deployed on-chain via CREATE2.
            The agent key can make payments within the policy limits. The owner key controls
            everything else: approvals, policy updates, revocation, and emergency withdrawals.
          </p>
        </Step>

        {/* Step 3 */}
        <Step n={3} title="Make a payment">
          <CodeBlock code={payCode} lang="typescript" />
          <p className="text-sm text-[#888] leading-relaxed">
            Every payment is validated by the on-chain Policy Engine before execution.
            If the amount exceeds{" "}
            <code className="font-mono text-accent text-xs bg-surface-3 px-1.5 py-0.5 rounded">approvalThreshold</code>,
            the transaction enters the approval queue and returns with status{" "}
            <code className="font-mono text-accent text-xs bg-surface-3 px-1.5 py-0.5 rounded">pending</code>.
            The owner can approve or deny it from the dashboard.
          </p>
        </Step>

        {/* Step 4 */}
        <Step n={4} title="Check the dashboard">
          <div className="rounded-xl border border-border bg-surface-2 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center text-accent text-sm">
                &#x2317;
              </div>
              <div>
                <p className="text-sm font-semibold text-white">PayClaw Dashboard</p>
                <p className="text-xs text-muted">app.payclaw.dev</p>
              </div>
            </div>
            <p className="text-sm text-[#888] leading-relaxed mb-4">
              The dashboard shows real-time transaction history, pending approvals,
              wallet balances, spend analytics, and a visual policy editor. Connect
              with the same owner wallet to manage your agent wallets.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Transaction history", "Approval queue", "Spend analytics", "Policy editor"].map(
                (badge) => (
                  <span
                    key={badge}
                    className="text-xs font-mono text-[#888] border border-border bg-surface-3 px-2.5 py-1 rounded-full"
                  >
                    {badge}
                  </span>
                )
              )}
            </div>
          </div>
        </Step>
      </div>

      {/* Next steps */}
      <div className="border-t border-border pt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">
          Next steps
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Agent Wallets", href: "/concepts/agent-wallets", desc: "How the owner+agent model works" },
            { label: "Policies", href: "/concepts/policies", desc: "Configure spending rules in detail" },
            { label: "Human Approval", href: "/guides/human-approval", desc: "Wire up the approval flow" },
            { label: "First Payment Guide", href: "/guides/first-payment", desc: "End-to-end walkthrough on BaseScan" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-4 hover:border-[#333] hover:bg-surface-3 transition-colors group"
            >
              <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
                {item.label} &rarr;
              </span>
              <span className="text-xs text-muted">{item.desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
