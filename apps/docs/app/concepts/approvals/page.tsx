import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Approvals",
  description: "How the PayClaw human approval flow works.",
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

const triggerCode = `// Agent tries to pay $75 (above the $50 approval threshold)
const tx = await wallet.pay({
  to: "0xVendor...",
  token: "USDC",
  amount: 75,
  memo: "Premium API access",
});

// tx.status === "pending" — queued for owner approval
console.log(tx.status);  // "pending"
console.log(tx.txHash);  // hash of the queue transaction`;

const approveCode = `// Owner approves via SDK
const receipt = await wallet.approve("request-id-123");
console.log(receipt.status); // "success" — payment executed

// Or deny
const denied = await wallet.deny("request-id-456");`;

const eventCode = `// Listen for approval events
wallet.on("approval:pending", (event) => {
  console.log("New approval request:", event.request.id);
  console.log("Amount:", event.request.amount, event.request.token);
  console.log("To:", event.request.to);
  console.log("Expires:", event.request.expiresAt);
  // Send notification to owner (Slack, email, push, etc.)
});

wallet.on("approval:resolved", (event) => {
  console.log("Request", event.request.id, "was", event.status);
  // "approved" | "denied" | "expired"
});`;

export default function ApprovalsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-12">
        <div className="flex items-center gap-2 text-xs font-mono text-muted mb-4">
          <Link href="/" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <Link href="/concepts/approvals" className="hover:text-white transition-colors">Concepts</Link>
          <span>/</span>
          <span className="text-accent">Approvals</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Approvals</h1>
        <p className="text-lg text-[#999] leading-relaxed">
          Human-in-the-loop for high-value transactions. The agent proposes, the owner decides.
        </p>
      </div>

      <div className="prose">
        <h2>When approval is triggered</h2>
        <p>
          A transaction enters the approval queue when its USD amount exceeds the wallet&apos;s{" "}
          <code>approvalThreshold</code>. The default threshold is <strong>$50</strong>.
          Transactions at or below the threshold execute immediately.
        </p>
        <p>
          The flow is entirely on-chain: the <strong>ApprovalQueue</strong> contract stores pending
          requests, and only the registered owner can approve or deny them.
        </p>

        <h2>Approval flow</h2>
        <div className="not-prose space-y-3 mb-6">
          {[
            { step: "1", label: "Agent sends transaction", desc: "The agent calls pay() with an amount above the approval threshold." },
            { step: "2", label: "Request queued on-chain", desc: "The smart contract creates an ApprovalRequest with a 24-hour expiration and returns status \"pending\"." },
            { step: "3", label: "Owner notified", desc: "The SDK emits an \"approval:pending\" event. Wire this to Slack, email, or push notifications." },
            { step: "4", label: "Owner reviews", desc: "The owner sees the request in the dashboard or receives it via the event handler." },
            { step: "5", label: "Approve or deny", desc: "The owner calls approve() or deny(). On approve, the payment executes. On deny, funds stay in the wallet." },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 rounded-lg border border-border bg-surface-2 p-4">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 font-mono text-xs font-bold text-accent">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-0.5">{item.label}</p>
                <p className="text-sm text-[#888]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <h2>Triggering an approval</h2>
        <CodeBlock code={triggerCode} />

        <h2>Approving or denying</h2>
        <CodeBlock code={approveCode} />
        <p>
          When the owner calls <code>approve()</code>, the contract re-checks the current
          policy before executing. If the policy was tightened since the request was created
          (e.g., the token was removed from the allowlist), the approval will fail.
        </p>

        <h2>Listening for approval events</h2>
        <CodeBlock code={eventCode} />

        <h2>Expiration</h2>
        <p>
          Approval requests expire after <strong>24 hours</strong> by default. Expired requests
          cannot be approved and the funds remain in the wallet. The agent can resubmit the
          transaction if needed.
        </p>

        <h2>Max pending limit</h2>
        <p>
          Each wallet can have at most <strong>10 pending approval requests</strong> at a time.
          If the agent tries to create an 11th pending request, the transaction reverts with{" "}
          <code>MAX_PENDING_APPROVALS</code>. This prevents an agent from flooding the queue.
        </p>

        <h2>ApprovalRequest object</h2>
        <div className="overflow-x-auto mb-6 not-prose">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted font-medium">Field</th>
                <th className="text-left py-2 pr-4 text-muted font-medium">Type</th>
                <th className="text-left py-2 pr-4 text-muted font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-[#b0b0b0]">
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-white font-mono text-xs">id</td>
                <td className="py-2 pr-4">string</td>
                <td className="py-2 pr-4">Unique request identifier</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-white font-mono text-xs">walletAddress</td>
                <td className="py-2 pr-4">string</td>
                <td className="py-2 pr-4">The wallet that created the request</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-white font-mono text-xs">to</td>
                <td className="py-2 pr-4">string</td>
                <td className="py-2 pr-4">Recipient address</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-white font-mono text-xs">token</td>
                <td className="py-2 pr-4">string</td>
                <td className="py-2 pr-4">Token symbol</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-white font-mono text-xs">amount</td>
                <td className="py-2 pr-4">string</td>
                <td className="py-2 pr-4">Amount in token units</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-white font-mono text-xs">usdValue</td>
                <td className="py-2 pr-4">number</td>
                <td className="py-2 pr-4">USD equivalent at time of request</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-white font-mono text-xs">status</td>
                <td className="py-2 pr-4">string</td>
                <td className="py-2 pr-4">&quot;pending&quot; | &quot;approved&quot; | &quot;denied&quot; | &quot;expired&quot;</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-white font-mono text-xs">createdAt</td>
                <td className="py-2 pr-4">Date</td>
                <td className="py-2 pr-4">When the request was created</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-white font-mono text-xs">expiresAt</td>
                <td className="py-2 pr-4">Date</td>
                <td className="py-2 pr-4">When the request expires (24h after creation)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="border-t border-border pt-10 mt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/guides/human-approval"
            className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-4 hover:border-[#333] hover:bg-surface-3 transition-colors group"
          >
            <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
              Human Approval Guide &rarr;
            </span>
            <span className="text-xs text-muted">Set up webhooks and dashboard approval</span>
          </Link>
          <Link
            href="/reference/agent-wallet"
            className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-4 hover:border-[#333] hover:bg-surface-3 transition-colors group"
          >
            <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
              AgentWallet API &rarr;
            </span>
            <span className="text-xs text-muted">approve() and deny() reference</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
