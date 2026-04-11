import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "PolicyEngine API",
  description: "PolicyEngine class API reference — validatePay, validateSwap, getConfig.",
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

export default function PolicyEngineReferencePage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-12">
        <div className="flex items-center gap-2 text-xs font-mono text-muted mb-4">
          <Link href="/" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <Link href="/reference/policy-engine" className="hover:text-white transition-colors">SDK Reference</Link>
          <span>/</span>
          <span className="text-accent">PolicyEngine</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">PolicyEngine</h1>
        <p className="text-lg text-[#999] leading-relaxed">
          Local policy validation that mirrors the on-chain contract. Used internally
          by <code className="font-mono text-accent bg-surface-3 px-1.5 py-0.5 rounded text-sm">AgentWallet</code> for
          pre-flight checks.
        </p>
      </div>

      <div className="prose">
        <h2>Overview</h2>
        <p>
          The <code>PolicyEngine</code> runs locally in the SDK to validate transactions before
          sending them to the blockchain. This gives you immediate feedback (no gas wasted on
          reverts) while the on-chain <strong>PolicyRegistry</strong> contract remains the source
          of truth.
        </p>
        <p>
          You typically do not instantiate <code>PolicyEngine</code> directly. It is created
          internally when you call <code>createWallet()</code> or <code>loadWallet()</code>.
          However, you can use it directly for pre-validation logic in your agent.
        </p>

        <h2>Import</h2>
        <CodeBlock code={`import { PolicyEngine } from "@payclaw/sdk";`} />

        <h2>Constructor</h2>
        <pre className="font-mono text-sm text-accent bg-surface-3 border border-border rounded-lg px-4 py-2 mb-3 overflow-x-auto">
          new PolicyEngine(config: PolicyConfig)
        </pre>
        <p>
          Creates a new PolicyEngine with the given policy configuration. All fields
          have sensible defaults if omitted.
        </p>
        <CodeBlock code={`const engine = new PolicyEngine({
  dailyLimit: 1000,
  perTransactionLimit: 100,
  approvalThreshold: 50,
  allowedTokens: ["USDC"],
  allowedRecipients: [],
  swapsEnabled: true,
  allowedRouters: [],
  cooldownSeconds: 0,
});`} />

        <h2>Methods</h2>

        <h3>validatePay</h3>
        <pre className="font-mono text-sm text-accent bg-surface-3 border border-border rounded-lg px-4 py-2 mb-3 overflow-x-auto">
          validatePay(params: PayParams, dailySpent: number): ValidationResult
        </pre>
        <p>
          Validates a payment against the policy rules. Returns whether the transaction
          is allowed, whether it needs approval, and the reason if blocked.
        </p>
        <CodeBlock code={`const result = engine.validatePay(
  { to: "0x...", token: "USDC", amount: 75 },
  200,  // $200 already spent today
);

if (!result.allowed) {
  console.log("Blocked:", result.reason);
  // "EXCEEDS_PER_TX_LIMIT" | "EXCEEDS_DAILY_LIMIT" |
  // "TOKEN_NOT_ALLOWED" | "RECIPIENT_NOT_ALLOWED"
} else if (result.needsApproval) {
  console.log("Needs human approval");
  // amount > approvalThreshold
} else {
  console.log("Good to go");
}`} />

        <h3>Validation order</h3>
        <p>
          The engine checks rules in this order. The first failing check determines
          the result:
        </p>
        <ol>
          <li><strong>Token allowlist</strong> &mdash; token must be in <code>allowedTokens</code> (if non-empty)</li>
          <li><strong>Recipient allowlist</strong> &mdash; recipient must be in <code>allowedRecipients</code> (if non-empty)</li>
          <li><strong>Per-transaction limit</strong> &mdash; <code>amount &lt;= perTransactionLimit</code></li>
          <li><strong>Daily limit</strong> &mdash; <code>dailySpent + amount &lt;= dailyLimit</code></li>
          <li><strong>Approval threshold</strong> &mdash; if <code>amount &gt; approvalThreshold</code>, returns <code>needsApproval: true</code></li>
        </ol>

        <h3>validateSwap</h3>
        <pre className="font-mono text-sm text-accent bg-surface-3 border border-border rounded-lg px-4 py-2 mb-3 overflow-x-auto">
          validateSwap(params: SwapParams, dailySpent: number): ValidationResult
        </pre>
        <p>
          Validates a swap operation. First checks if swaps are enabled, then runs the
          same amount checks as <code>validatePay</code>.
        </p>
        <CodeBlock code={`const result = engine.validateSwap(
  { from: "USDC", to: "WETH", amount: 100 },
  0,  // nothing spent yet today
);

if (!result.allowed && result.reason === "SWAPS_DISABLED") {
  console.log("Swaps are disabled in this wallet's policy");
}`} />

        <h3>getConfig</h3>
        <pre className="font-mono text-sm text-accent bg-surface-3 border border-border rounded-lg px-4 py-2 mb-3 overflow-x-auto">
          getConfig(): Required&lt;PolicyConfig&gt;
        </pre>
        <p>
          Returns the full policy configuration with all defaults filled in.
        </p>
        <CodeBlock code={`const config = engine.getConfig();

console.log(config.dailyLimit);         // 1000
console.log(config.perTransactionLimit); // 100
console.log(config.approvalThreshold);   // 50
console.log(config.allowedTokens);       // ["USDC"]
console.log(config.swapsEnabled);        // true
console.log(config.cooldownSeconds);     // 0`} />

        <h2>ValidationResult</h2>
        <CodeBlock code={`interface ValidationResult {
  allowed: boolean;       // can the transaction proceed?
  needsApproval: boolean; // must it go through approval queue?
  reason?: string;        // ErrorCode if blocked or needs approval
}`} />

        <h2>Error codes</h2>
        <div className="overflow-x-auto mb-6 not-prose">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted font-medium">Code</th>
                <th className="text-left py-2 pr-4 text-muted font-medium">Meaning</th>
              </tr>
            </thead>
            <tbody className="text-[#b0b0b0]">
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-accent font-mono text-xs">TOKEN_NOT_ALLOWED</td>
                <td className="py-2 pr-4">Token not in allowedTokens list</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-accent font-mono text-xs">RECIPIENT_NOT_ALLOWED</td>
                <td className="py-2 pr-4">Recipient not in allowedRecipients list</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-accent font-mono text-xs">EXCEEDS_PER_TX_LIMIT</td>
                <td className="py-2 pr-4">Amount exceeds per-transaction limit</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-accent font-mono text-xs">EXCEEDS_DAILY_LIMIT</td>
                <td className="py-2 pr-4">Would exceed daily spending limit</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-accent font-mono text-xs">SWAPS_DISABLED</td>
                <td className="py-2 pr-4">Swap attempted but swapsEnabled is false</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-accent font-mono text-xs">REQUIRES_APPROVAL</td>
                <td className="py-2 pr-4">Amount exceeds approval threshold (allowed but needs approval)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="border-t border-border pt-10 mt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/concepts/policies"
            className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-4 hover:border-[#333] hover:bg-surface-3 transition-colors group"
          >
            <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
              Policies Concept &rarr;
            </span>
            <span className="text-xs text-muted">Profiles and configuration guide</span>
          </Link>
          <Link
            href="/reference/events"
            className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-4 hover:border-[#333] hover:bg-surface-3 transition-colors group"
          >
            <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
              Events &rarr;
            </span>
            <span className="text-xs text-muted">Event system reference</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
