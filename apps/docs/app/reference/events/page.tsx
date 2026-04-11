import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Events",
  description: "PayClaw event system — all event types, subscription, and handler examples.",
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

export default function EventsReferencePage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-12">
        <div className="flex items-center gap-2 text-xs font-mono text-muted mb-4">
          <Link href="/" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <Link href="/reference/events" className="hover:text-white transition-colors">SDK Reference</Link>
          <span>/</span>
          <span className="text-accent">Events</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Events</h1>
        <p className="text-lg text-[#999] leading-relaxed">
          Subscribe to wallet events for real-time monitoring, notifications, and logging.
        </p>
      </div>

      <div className="prose">
        <h2>Subscribing to events</h2>
        <p>
          Use the <code>wallet.on()</code> method to subscribe to events. It returns an
          unsubscribe function you can call to stop listening.
        </p>
        <CodeBlock code={`const unsubscribe = wallet.on("payment:executed", (event) => {
  console.log("Payment executed:", event.tx.txHash);
});

// Stop listening when done
unsubscribe();`} />

        <h2>Event types</h2>
        <div className="overflow-x-auto mb-6 not-prose">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted font-medium">Event</th>
                <th className="text-left py-2 pr-4 text-muted font-medium">Payload</th>
                <th className="text-left py-2 pr-4 text-muted font-medium">When</th>
              </tr>
            </thead>
            <tbody className="text-[#b0b0b0]">
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-accent font-mono text-xs">payment:executed</td>
                <td className="py-2 pr-4 font-mono text-xs">{`{ tx: TxReceipt }`}</td>
                <td className="py-2 pr-4">A payment was sent successfully</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-accent font-mono text-xs">payment:denied</td>
                <td className="py-2 pr-4 font-mono text-xs">{`{ reason: string, params: PayParams }`}</td>
                <td className="py-2 pr-4">A payment was blocked by the policy engine</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-accent font-mono text-xs">swap:executed</td>
                <td className="py-2 pr-4 font-mono text-xs">{`{ tx: TxReceipt }`}</td>
                <td className="py-2 pr-4">A swap was executed successfully</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-accent font-mono text-xs">approval:pending</td>
                <td className="py-2 pr-4 font-mono text-xs">{`{ request: ApprovalRequest }`}</td>
                <td className="py-2 pr-4">A transaction was queued for approval</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-accent font-mono text-xs">approval:resolved</td>
                <td className="py-2 pr-4 font-mono text-xs">{`{ request: ApprovalRequest, status }`}</td>
                <td className="py-2 pr-4">A pending request was approved, denied, or expired</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-accent font-mono text-xs">policy:updated</td>
                <td className="py-2 pr-4 font-mono text-xs">{`{ policy: PolicyConfig }`}</td>
                <td className="py-2 pr-4">The wallet policies were updated</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-accent font-mono text-xs">wallet:funded</td>
                <td className="py-2 pr-4 font-mono text-xs">{`{ token: string, amount: string }`}</td>
                <td className="py-2 pr-4">Tokens were deposited into the wallet</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-accent font-mono text-xs">wallet:drained</td>
                <td className="py-2 pr-4 font-mono text-xs">{`{ token: string }`}</td>
                <td className="py-2 pr-4">Emergency withdrawal was executed</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>Example handlers</h2>

        <h3>Payment monitoring</h3>
        <CodeBlock code={`wallet.on("payment:executed", (event) => {
  const { txHash, status, usdValue, chain } = event.tx;
  console.log(\`[PAYMENT] \${txHash} | \$\${usdValue} | \${status}\`);

  // Log to your monitoring system
  analytics.track("agent_payment", {
    txHash,
    amount: usdValue,
    chain,
    timestamp: event.tx.timestamp,
  });
});`} />

        <h3>Approval notifications</h3>
        <CodeBlock code={`wallet.on("approval:pending", async (event) => {
  const { id, to, token, amount, expiresAt } = event.request;

  // Send Slack notification
  await slack.send({
    channel: "#agent-alerts",
    text: [
      \`New approval request: \${id}\`,
      \`Amount: \${amount} \${token} to \${to}\`,
      \`Expires: \${expiresAt.toISOString()}\`,
      \`Approve in dashboard: https://app.payclaw.dev/approvals/\${id}\`,
    ].join("\\n"),
  });
});

wallet.on("approval:resolved", (event) => {
  console.log(\`Request \${event.request.id}: \${event.status}\`);
  // "approved" | "denied" | "expired"
});`} />

        <h3>Security alerts</h3>
        <CodeBlock code={`wallet.on("payment:denied", (event) => {
  console.warn(
    \`[BLOCKED] \${event.reason}: \${event.params.amount} \${event.params.token} to \${event.params.to}\`
  );
  // Alert: the agent tried to do something outside its policy
});

wallet.on("wallet:drained", (event) => {
  console.warn(\`[EMERGENCY] Wallet drained: \${event.token}\`);
  // Critical alert — someone used emergencyWithdraw
});`} />

        <h3>Policy change tracking</h3>
        <CodeBlock code={`wallet.on("policy:updated", (event) => {
  console.log("Policy updated:", JSON.stringify(event.policy, null, 2));
  // Log the change for audit trail
});`} />

        <h2>Type definitions</h2>
        <CodeBlock code={`type PayClawEvent =
  | { type: "payment:executed"; tx: TxReceipt }
  | { type: "payment:denied"; reason: string; params: PayParams }
  | { type: "swap:executed"; tx: TxReceipt }
  | { type: "approval:pending"; request: ApprovalRequest }
  | { type: "approval:resolved"; request: ApprovalRequest; status: "approved" | "denied" | "expired" }
  | { type: "policy:updated"; policy: PolicyConfig }
  | { type: "wallet:funded"; token: string; amount: string }
  | { type: "wallet:drained"; token: string };

type PayClawEventType = PayClawEvent["type"];

type EventHandler<T extends PayClawEventType> = (
  event: Extract<PayClawEvent, { type: T }>
) => void;

type Unsubscribe = () => void;`} />
      </div>

      <div className="border-t border-border pt-10 mt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/reference/agent-wallet"
            className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-4 hover:border-[#333] hover:bg-surface-3 transition-colors group"
          >
            <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
              AgentWallet API &rarr;
            </span>
            <span className="text-xs text-muted">All wallet methods</span>
          </Link>
          <Link
            href="/guides/human-approval"
            className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-4 hover:border-[#333] hover:bg-surface-3 transition-colors group"
          >
            <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
              Human Approval Guide &rarr;
            </span>
            <span className="text-xs text-muted">Set up approval notifications</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
