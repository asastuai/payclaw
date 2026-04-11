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
      {/* Step indicator line */}
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 font-mono text-sm font-bold text-accent">
          {n}
        </div>
        <div className="mt-2 flex-1 w-px bg-border" />
      </div>

      {/* Content */}
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

const createWalletCode = `import { PayClaw } from "@payclaw/sdk";

const claw = new PayClaw({ apiKey: process.env.PAYCLAW_API_KEY });

const wallet = await claw.createWallet({
  name: "my-agent",
  chain: "base",
  policy: {
    maxPerTx: "50",          // max $50 per transaction
    dailyLimit: "200",        // max $200 per day
    allowedTokens: ["USDC"],  // only stablecoins
    requireApprovalAbove: "100", // ask human if > $100
  },
});

console.log("Wallet address:", wallet.address);`;

const payCode = `// Your AI agent calls this when it needs to pay
const tx = await wallet.pay({
  to: "0xVendorAddress",
  amount: "12.50",
  token: "USDC",
  memo: "API subscription - Nov 2025",
});

console.log("Transaction hash:", tx.hash);
console.log("Status:", tx.status); // "confirmed" | "pending_approval"`;

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
          <CodeBlock
            code="npm install @payclaw/sdk\n# or\npnpm add @payclaw/sdk\n# or\nyarn add @payclaw/sdk"
            lang="bash"
          />
          <p className="text-sm text-[#888] leading-relaxed">
            The SDK is framework-agnostic — works with any Node.js runtime, Bun,
            or edge environments.
          </p>
        </Step>

        {/* Step 2 */}
        <Step n={2} title="Create a wallet">
          <CodeBlock code={createWalletCode} lang="typescript" />
          <div className="rounded-lg border border-[#ffcc66]/20 bg-[#ffcc66]/5 px-4 py-3 text-sm text-[#ffcc66]">
            <strong className="font-semibold">Note:</strong> Store your{" "}
            <code className="font-mono bg-surface px-1 rounded">PAYCLAW_API_KEY</code> in an
            environment variable — never commit it to source control.
          </div>
        </Step>

        {/* Step 3 */}
        <Step n={3} title="Make a payment">
          <CodeBlock code={payCode} lang="typescript" />
          <p className="text-sm text-[#888] leading-relaxed">
            If the payment exceeds your{" "}
            <code className="font-mono text-accent text-xs bg-surface-3 px-1.5 py-0.5 rounded">requireApprovalAbove</code>{" "}
            threshold, it returns <code className="font-mono text-accent text-xs bg-surface-3 px-1.5 py-0.5 rounded">pending_approval</code>{" "}
            and waits for a human to approve via the dashboard.
          </p>
        </Step>

        {/* Step 4 */}
        <Step n={4} title="Check the dashboard">
          <div className="rounded-xl border border-border bg-surface-2 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center text-accent text-sm">
                ⌗
              </div>
              <div>
                <p className="text-sm font-semibold text-white">PayClaw Dashboard</p>
                <p className="text-xs text-muted">app.payclaw.dev</p>
              </div>
            </div>
            <p className="text-sm text-[#888] leading-relaxed mb-4">
              The dashboard shows real-time transaction history, policy status,
              pending approvals, and wallet balances across all your agent wallets.
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
            { label: "Agent Wallets", href: "/concepts/agent-wallets", desc: "How wallets work under the hood" },
            { label: "Policies", href: "/concepts/policies", desc: "Configure spending rules" },
            { label: "Human Approval", href: "/guides/human-approval", desc: "Wire up approval webhooks" },
            { label: "Multi-chain", href: "/guides/multi-chain", desc: "Deploy across chains" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-4 hover:border-[#333] hover:bg-surface-3 transition-colors group"
            >
              <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
                {item.label} →
              </span>
              <span className="text-xs text-muted">{item.desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
