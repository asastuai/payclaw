import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Agent Wallets",
  description: "How PayClaw agent wallets work — the owner+agent model explained.",
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

const createCode = `import { PayClaw } from "@payclaw/sdk";

const payclaw = new PayClaw({ chain: "base" });

const wallet = await payclaw.createWallet({
  ownerPrivateKey: process.env.OWNER_KEY!,   // controls rules & approvals
  agentPrivateKey: process.env.AGENT_KEY!,   // operates within rules
  policies: {
    dailyLimit: 1000,
    perTransactionLimit: 100,
    approvalThreshold: 50,
    allowedTokens: ["USDC"],
  },
});`;

const loadCode = `// Reconnect to an existing wallet in a new session
const wallet = await payclaw.loadWallet(
  "0xWalletAddress...",
  {
    dailyLimit: 1000,
    perTransactionLimit: 100,
    approvalThreshold: 50,
    allowedTokens: ["USDC"],
  },
  {
    ownerPrivateKey: process.env.OWNER_KEY!,
    agentPrivateKey: process.env.AGENT_KEY!,
  },
);`;

const revokeCode = `// Owner revokes the agent — no more transactions
await wallet.revokeAgent();

// Emergency: pull all funds out immediately
await wallet.emergencyWithdraw("USDC");`;

export default function AgentWalletsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-12">
        <div className="flex items-center gap-2 text-xs font-mono text-muted mb-4">
          <Link href="/" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <Link href="/concepts/agent-wallets" className="hover:text-white transition-colors">Concepts</Link>
          <span>/</span>
          <span className="text-accent">Agent Wallets</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Agent Wallets</h1>
        <p className="text-lg text-[#999] leading-relaxed">
          A smart contract wallet designed for AI agents: the agent operates, the owner controls.
        </p>
      </div>

      <div className="prose">
        <h2>What is an Agent Wallet?</h2>
        <p>
          An Agent Wallet is an <strong>ERC-4337 smart account</strong> deployed on-chain
          that holds funds and executes transactions. Unlike a regular EOA (externally owned
          account) or a multisig, an agent wallet has two distinct roles built into the
          contract:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 not-prose">
          <div className="rounded-xl border border-border bg-surface-2 p-5">
            <div className="text-sm font-semibold text-accent mb-2">Owner</div>
            <ul className="text-sm text-[#888] space-y-1.5">
              <li>Sets and updates policy rules</li>
              <li>Approves or denies queued transactions</li>
              <li>Revokes the agent at any time</li>
              <li>Emergency withdraws all funds</li>
              <li>Cannot be changed after deployment</li>
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-surface-2 p-5">
            <div className="text-sm font-semibold text-[#66ccff] mb-2">Agent</div>
            <ul className="text-sm text-[#888] space-y-1.5">
              <li>Executes <code className="font-mono text-accent bg-surface-3 px-1 rounded text-xs">pay()</code> and <code className="font-mono text-accent bg-surface-3 px-1 rounded text-xs">swap()</code></li>
              <li>Operates only within policy limits</li>
              <li>Cannot change policies</li>
              <li>Cannot withdraw funds directly</li>
              <li>Can be revoked by the owner</li>
            </ul>
          </div>
        </div>

        <h2>How it differs from EOA and Multisig</h2>
        <div className="overflow-x-auto mb-6 not-prose">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted font-medium">Feature</th>
                <th className="text-left py-2 pr-4 text-muted font-medium">EOA</th>
                <th className="text-left py-2 pr-4 text-muted font-medium">Multisig</th>
                <th className="text-left py-2 pr-4 text-accent font-medium">Agent Wallet</th>
              </tr>
            </thead>
            <tbody className="text-[#b0b0b0]">
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-white">Spending limits</td>
                <td className="py-2 pr-4">None</td>
                <td className="py-2 pr-4">None</td>
                <td className="py-2 pr-4 text-accent">On-chain enforced</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-white">Token restrictions</td>
                <td className="py-2 pr-4">None</td>
                <td className="py-2 pr-4">None</td>
                <td className="py-2 pr-4 text-accent">Allowlist</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-white">Human approval flow</td>
                <td className="py-2 pr-4">N/A</td>
                <td className="py-2 pr-4">All txs require sigs</td>
                <td className="py-2 pr-4 text-accent">Only above threshold</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-white">Gasless transactions</td>
                <td className="py-2 pr-4">No</td>
                <td className="py-2 pr-4">No</td>
                <td className="py-2 pr-4 text-accent">Yes (ERC-4337)</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-white">Revocation</td>
                <td className="py-2 pr-4">Rotate key</td>
                <td className="py-2 pr-4">Remove signer</td>
                <td className="py-2 pr-4 text-accent">One-call revoke</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-white">Best for</td>
                <td className="py-2 pr-4">Humans</td>
                <td className="py-2 pr-4">Teams</td>
                <td className="py-2 pr-4 text-accent">AI agents</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>Lifecycle</h2>
        <p>Every agent wallet goes through four stages:</p>

        <div className="not-prose space-y-3 mb-6">
          {[
            { step: "1. Create", desc: "Deploy the wallet smart contract via the factory. Owner and agent keys are set. Policies are registered on-chain.", color: "text-accent" },
            { step: "2. Fund", desc: "Transfer tokens (e.g. USDC) to the wallet address. The wallet is now ready to operate.", color: "text-[#66ccff]" },
            { step: "3. Operate", desc: "The agent calls pay() and swap() within policy limits. Transactions above the approval threshold queue for the owner.", color: "text-[#ffcc66]" },
            { step: "4. Revoke", desc: "When the agent is no longer needed, the owner revokes agent access and optionally withdraws all remaining funds.", color: "text-[#ff9966]" },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 rounded-lg border border-border bg-surface-2 p-4">
              <div className={`text-sm font-semibold font-mono whitespace-nowrap ${item.color}`}>{item.step}</div>
              <p className="text-sm text-[#888]">{item.desc}</p>
            </div>
          ))}
        </div>

        <h2>Create a wallet</h2>
        <CodeBlock code={createCode} />
        <p>
          The factory deploys the wallet via CREATE2, so the address is deterministic.
          You can pass an optional <code>salt</code> parameter to control the address.
        </p>

        <h2>Reconnect to an existing wallet</h2>
        <CodeBlock code={loadCode} />
        <p>
          Use <code>loadWallet</code> when your process restarts or you need to interact
          with a wallet created in a previous session.
        </p>

        <h2>Revoke and withdraw</h2>
        <CodeBlock code={revokeCode} />
        <p>
          <code>revokeAgent()</code> permanently disables the agent key. After revocation,
          only the owner can interact with the wallet. <code>emergencyWithdraw()</code>
          transfers the entire balance of a token to the owner address.
        </p>
      </div>

      {/* Next steps */}
      <div className="border-t border-border pt-10 mt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/concepts/policies"
            className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-4 hover:border-[#333] hover:bg-surface-3 transition-colors group"
          >
            <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
              Policies &rarr;
            </span>
            <span className="text-xs text-muted">Configure spending rules</span>
          </Link>
          <Link
            href="/reference/agent-wallet"
            className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-4 hover:border-[#333] hover:bg-surface-3 transition-colors group"
          >
            <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
              AgentWallet API &rarr;
            </span>
            <span className="text-xs text-muted">Full method reference</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
