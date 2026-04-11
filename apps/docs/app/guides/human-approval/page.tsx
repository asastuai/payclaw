import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Human Approval",
  description: "Set up the human approval flow with webhooks, notifications, and dashboard approval.",
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
      <div className="pb-10 min-w-0 w-full">
        <h2 className="text-lg font-semibold text-white mb-3">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export default function HumanApprovalPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-12">
        <div className="flex items-center gap-2 text-xs font-mono text-muted mb-4">
          <Link href="/" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <Link href="/guides/human-approval" className="hover:text-white transition-colors">Guides</Link>
          <span>/</span>
          <span className="text-accent">Human Approval</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Human Approval Flow</h1>
        <p className="text-lg text-[#999] leading-relaxed">
          Wire up notifications, review pending requests, and approve or deny from the
          dashboard or programmatically.
        </p>
      </div>

      <div>
        <Step n={1} title="Configure the approval threshold">
          <p className="text-sm text-[#888] leading-relaxed mb-3">
            Set the <code className="font-mono text-accent text-xs bg-surface-3 px-1.5 py-0.5 rounded">approvalThreshold</code> when
            creating the wallet. Any transaction with a USD value above this
            amount will be queued instead of executed.
          </p>
          <CodeBlock code={`const wallet = await payclaw.createWallet({
  ownerPrivateKey: process.env.OWNER_KEY!,
  agentPrivateKey: process.env.AGENT_KEY!,
  policies: {
    dailyLimit: 1000,
    perTransactionLimit: 500,
    approvalThreshold: 50,    // human approval for anything > $50
    allowedTokens: ["USDC"],
  },
});`} />
        </Step>

        <Step n={2} title="Set up event listeners">
          <p className="text-sm text-[#888] leading-relaxed mb-3">
            Listen for <code className="font-mono text-accent text-xs bg-surface-3 px-1.5 py-0.5 rounded">approval:pending</code> events
            and send notifications to the person who will approve or deny.
          </p>
          <CodeBlock code={`// Slack notification example
wallet.on("approval:pending", async (event) => {
  const { id, to, token, amount, usdValue, expiresAt, memo } = event.request;

  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: [
        ":rotating_light: *Approval Required*",
        \`> Request: \${id}\`,
        \`> Amount: \${amount} \${token} ($\${usdValue})\`,
        \`> To: \\\`\${to}\\\`\`,
        memo ? \`> Memo: \${memo}\` : null,
        \`> Expires: \${expiresAt.toISOString()}\`,
        \`> <https://app.payclaw.dev/approvals/\${id}|Approve in Dashboard>\`,
      ].filter(Boolean).join("\\n"),
    }),
  });
});`} />
          <p className="text-sm text-[#888] leading-relaxed mb-3">
            You can also send email, SMS, push notifications, or Telegram messages.
            The event payload contains everything you need.
          </p>
        </Step>

        <Step n={3} title="Review in the dashboard">
          <div className="rounded-xl border border-border bg-surface-2 p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center text-accent text-sm">
                &#x2317;
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Approval Queue</p>
                <p className="text-xs text-muted">app.payclaw.dev/approvals</p>
              </div>
            </div>
            <p className="text-sm text-[#888] leading-relaxed mb-4">
              The dashboard shows all pending approval requests across your wallets.
              Each request displays the amount, recipient, token, memo, time remaining,
              and a one-click approve/deny button.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Amount & token", "Recipient address", "Time remaining", "Approve / Deny"].map(
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

        <Step n={4} title="Approve or deny programmatically">
          <p className="text-sm text-[#888] leading-relaxed mb-3">
            For automated workflows, the owner can approve or deny via the SDK:
          </p>
          <CodeBlock code={`// Approve a specific request
const receipt = await wallet.approve("req-abc123");
console.log("Approved:", receipt.txHash);

// Deny a specific request
const denied = await wallet.deny("req-xyz789");
console.log("Denied:", denied.txHash);`} />
          <p className="text-sm text-[#888] leading-relaxed">
            When you call <code className="font-mono text-accent text-xs bg-surface-3 px-1.5 py-0.5 rounded">approve()</code>,
            the contract re-checks the current policy before executing the payment.
            If the policy was tightened since the request was created, the approval may fail.
          </p>
        </Step>

        <Step n={5} title="Handle expiration">
          <p className="text-sm text-[#888] leading-relaxed mb-3">
            Requests expire after 24 hours. Track resolution events to update your
            systems:
          </p>
          <CodeBlock code={`wallet.on("approval:resolved", (event) => {
  const { id, status } = { id: event.request.id, status: event.status };

  switch (event.status) {
    case "approved":
      console.log(\`Request \${id} approved — payment executed\`);
      break;
    case "denied":
      console.log(\`Request \${id} denied — funds remain in wallet\`);
      break;
    case "expired":
      console.log(\`Request \${id} expired — no action taken\`);
      // Optionally: have the agent resubmit
      break;
  }
});`} />
        </Step>

        <Step n={6} title="Build a custom approval webhook">
          <p className="text-sm text-[#888] leading-relaxed mb-3">
            For more control, build a small Express server that receives approval
            events and exposes approve/deny endpoints:
          </p>
          <CodeBlock code={`import express from "express";
import { PayClaw } from "@payclaw/sdk";

const app = express();
app.use(express.json());

const payclaw = new PayClaw({ chain: "base" });
const wallet = await payclaw.loadWallet("0xWallet...", policies, keys);

// Store pending requests
const pending = new Map();

wallet.on("approval:pending", (event) => {
  pending.set(event.request.id, event.request);
});

// GET /approvals — list pending
app.get("/approvals", (req, res) => {
  res.json([...pending.values()]);
});

// POST /approvals/:id/approve
app.post("/approvals/:id/approve", async (req, res) => {
  try {
    const receipt = await wallet.approve(req.params.id);
    pending.delete(req.params.id);
    res.json({ status: "approved", txHash: receipt.txHash });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// POST /approvals/:id/deny
app.post("/approvals/:id/deny", async (req, res) => {
  try {
    const receipt = await wallet.deny(req.params.id);
    pending.delete(req.params.id);
    res.json({ status: "denied", txHash: receipt.txHash });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.listen(3001, () => console.log("Approval server on :3001"));`} />
        </Step>
      </div>

      <div className="prose mt-6">
        <h2>Best practices</h2>
        <ul>
          <li><strong>Set sensible thresholds</strong> &mdash; too low and you will be flooded with requests; too high and you lose oversight.</li>
          <li><strong>Monitor the queue</strong> &mdash; expired requests mean missed decisions. Set up alerts for pending requests.</li>
          <li><strong>Use the max pending limit</strong> &mdash; the 10-request cap prevents queue flooding. If hit, check if the agent is malfunctioning.</li>
          <li><strong>Combine with recipient allowlists</strong> &mdash; known recipients can have higher thresholds; unknown recipients should trigger approval at lower amounts.</li>
          <li><strong>Audit trail</strong> &mdash; log all <code>approval:resolved</code> events with the full request details for compliance.</li>
        </ul>
      </div>

      <div className="border-t border-border pt-10 mt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/concepts/approvals"
            className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-4 hover:border-[#333] hover:bg-surface-3 transition-colors group"
          >
            <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
              Approvals Concept &rarr;
            </span>
            <span className="text-xs text-muted">How the approval system works</span>
          </Link>
          <Link
            href="/reference/events"
            className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-4 hover:border-[#333] hover:bg-surface-3 transition-colors group"
          >
            <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
              Events Reference &rarr;
            </span>
            <span className="text-xs text-muted">All event types</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
