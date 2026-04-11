import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Policies",
  description: "How the PayClaw policy engine enforces spending rules on-chain.",
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

const conservativeCode = `// Conservative: low limits, stablecoins only, known recipients
const wallet = await payclaw.createWallet({
  ownerPrivateKey: process.env.OWNER_KEY!,
  agentPrivateKey: process.env.AGENT_KEY!,
  policies: {
    dailyLimit: 100,
    perTransactionLimit: 25,
    approvalThreshold: 10,
    allowedTokens: ["USDC"],
    allowedRecipients: ["0xKnownVendor1...", "0xKnownVendor2..."],
    swapsEnabled: false,
    cooldownSeconds: 60,   // 1 minute between transactions
  },
});`;

const moderateCode = `// Moderate: reasonable limits, stablecoins, swaps enabled
const wallet = await payclaw.createWallet({
  ownerPrivateKey: process.env.OWNER_KEY!,
  agentPrivateKey: process.env.AGENT_KEY!,
  policies: {
    dailyLimit: 1000,
    perTransactionLimit: 100,
    approvalThreshold: 50,
    allowedTokens: ["USDC", "USDT", "DAI"],
    allowedRecipients: [],          // any recipient allowed
    swapsEnabled: true,
    allowedRouters: [],             // default routers only
    cooldownSeconds: 0,
  },
});`;

const aggressiveCode = `// Aggressive: high limits, any token, minimal friction
const wallet = await payclaw.createWallet({
  ownerPrivateKey: process.env.OWNER_KEY!,
  agentPrivateKey: process.env.AGENT_KEY!,
  policies: {
    dailyLimit: 10000,
    perTransactionLimit: 5000,
    approvalThreshold: 2000,
    allowedTokens: [],              // any token
    allowedRecipients: [],          // any recipient
    swapsEnabled: true,
    allowedRouters: [],
    cooldownSeconds: 0,
  },
});`;

const updateCode = `// Update policies at runtime (owner only)
await wallet.updatePolicies({
  dailyLimit: 2000,                 // increase daily limit
  perTransactionLimit: 200,
  approvalThreshold: 100,
  allowedTokens: ["USDC", "USDT"], // add USDT
});`;

export default function PoliciesPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-12">
        <div className="flex items-center gap-2 text-xs font-mono text-muted mb-4">
          <Link href="/" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <Link href="/concepts/policies" className="hover:text-white transition-colors">Concepts</Link>
          <span>/</span>
          <span className="text-accent">Policies</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Policies</h1>
        <p className="text-lg text-[#999] leading-relaxed">
          Programmable spending rules enforced on-chain. The agent cannot bypass them.
        </p>
      </div>

      <div className="prose">
        <h2>How it works</h2>
        <p>
          Every transaction an agent sends passes through the <strong>PolicyRegistry</strong> smart
          contract before execution. The contract checks the transaction parameters against the
          wallet&apos;s policy configuration. If any rule is violated, the transaction reverts
          on-chain. No off-chain middleware, no trust assumptions.
        </p>

        <h2>Policy rules reference</h2>
        <div className="overflow-x-auto mb-6 not-prose">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted font-medium">Rule</th>
                <th className="text-left py-2 pr-4 text-muted font-medium">Type</th>
                <th className="text-left py-2 pr-4 text-muted font-medium">Default</th>
                <th className="text-left py-2 pr-4 text-muted font-medium">Enforcement</th>
              </tr>
            </thead>
            <tbody className="text-[#b0b0b0]">
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-white"><code className="font-mono text-accent bg-surface-3 px-1 rounded text-xs">dailyLimit</code></td>
                <td className="py-2 pr-4">number (USD)</td>
                <td className="py-2 pr-4">1,000</td>
                <td className="py-2 pr-4">On-chain</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-white"><code className="font-mono text-accent bg-surface-3 px-1 rounded text-xs">perTransactionLimit</code></td>
                <td className="py-2 pr-4">number (USD)</td>
                <td className="py-2 pr-4">100</td>
                <td className="py-2 pr-4">On-chain</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-white"><code className="font-mono text-accent bg-surface-3 px-1 rounded text-xs">approvalThreshold</code></td>
                <td className="py-2 pr-4">number (USD)</td>
                <td className="py-2 pr-4">50</td>
                <td className="py-2 pr-4">On-chain</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-white"><code className="font-mono text-accent bg-surface-3 px-1 rounded text-xs">allowedTokens</code></td>
                <td className="py-2 pr-4">string[]</td>
                <td className="py-2 pr-4">[] (all tokens)</td>
                <td className="py-2 pr-4">On-chain</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-white"><code className="font-mono text-accent bg-surface-3 px-1 rounded text-xs">allowedRecipients</code></td>
                <td className="py-2 pr-4">string[]</td>
                <td className="py-2 pr-4">[] (anyone)</td>
                <td className="py-2 pr-4">On-chain</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-white"><code className="font-mono text-accent bg-surface-3 px-1 rounded text-xs">swapsEnabled</code></td>
                <td className="py-2 pr-4">boolean</td>
                <td className="py-2 pr-4">true</td>
                <td className="py-2 pr-4">On-chain</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-white"><code className="font-mono text-accent bg-surface-3 px-1 rounded text-xs">allowedRouters</code></td>
                <td className="py-2 pr-4">string[]</td>
                <td className="py-2 pr-4">[] (defaults)</td>
                <td className="py-2 pr-4">On-chain</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-white"><code className="font-mono text-accent bg-surface-3 px-1 rounded text-xs">cooldownSeconds</code></td>
                <td className="py-2 pr-4">number</td>
                <td className="py-2 pr-4">0</td>
                <td className="py-2 pr-4">On-chain</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>On-chain enforcement</h2>
        <p>
          All rules are enforced in the <strong>PolicyRegistry</strong> Solidity contract.
          The SDK&apos;s <code>PolicyEngine</code> mirrors this logic locally for pre-flight
          validation (so you get immediate errors instead of waiting for a revert), but the
          on-chain contract is the source of truth.
        </p>
        <p>
          When an empty array is passed for <code>allowedTokens</code>, <code>allowedRecipients</code>,
          or <code>allowedRouters</code>, it means &quot;allow all&quot;. To restrict, explicitly
          list the allowed values.
        </p>

        <h2>Validation flow</h2>
        <p>
          For every <code>pay()</code> call, the engine checks in this order:
        </p>
        <ol>
          <li><strong>Token allowlist</strong> &mdash; is the token in <code>allowedTokens</code>?</li>
          <li><strong>Recipient allowlist</strong> &mdash; is the recipient in <code>allowedRecipients</code>?</li>
          <li><strong>Per-transaction limit</strong> &mdash; is <code>amount &lt;= perTransactionLimit</code>?</li>
          <li><strong>Daily limit</strong> &mdash; is <code>dailySpent + amount &lt;= dailyLimit</code>?</li>
          <li><strong>Approval threshold</strong> &mdash; if <code>amount &gt; approvalThreshold</code>, queue for approval.</li>
        </ol>
        <p>
          For <code>swap()</code>, the engine additionally checks <code>swapsEnabled</code> and the
          router allowlist before running the same amount checks.
        </p>

        <h2>Policy profiles</h2>
        <h3>Conservative</h3>
        <p>
          Best for customer support agents, refund bots, or any use case where the agent
          handles sensitive operations with low transaction values.
        </p>
        <CodeBlock code={conservativeCode} />

        <h3>Moderate</h3>
        <p>
          Good default for most use cases. The agent can pay anyone with common stablecoins
          and swap tokens, but larger transactions need human approval.
        </p>
        <CodeBlock code={moderateCode} />

        <h3>Aggressive</h3>
        <p>
          For trading bots or high-throughput agents where speed matters and the owner
          trusts the agent logic. Still enforces daily limits as a safety net.
        </p>
        <CodeBlock code={aggressiveCode} />

        <h2>Updating policies at runtime</h2>
        <p>
          The owner can update policies at any time. The update is an on-chain transaction
          and takes effect immediately.
        </p>
        <CodeBlock code={updateCode} />
        <div className="rounded-lg border border-[#ffcc66]/20 bg-[#ffcc66]/5 px-4 py-3 text-sm text-[#ffcc66] mb-4 not-prose">
          <strong className="font-semibold">Note:</strong> Policy updates are not retroactive.
          Pending approval requests created under the old policy will be re-checked against
          the new policy when approved.
        </div>
      </div>

      <div className="border-t border-border pt-10 mt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/concepts/approvals"
            className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-4 hover:border-[#333] hover:bg-surface-3 transition-colors group"
          >
            <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
              Approvals &rarr;
            </span>
            <span className="text-xs text-muted">How the approval flow works</span>
          </Link>
          <Link
            href="/guides/spending-limits"
            className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-4 hover:border-[#333] hover:bg-surface-3 transition-colors group"
          >
            <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
              Spending Limits Guide &rarr;
            </span>
            <span className="text-xs text-muted">Set up limit profiles for your use case</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
