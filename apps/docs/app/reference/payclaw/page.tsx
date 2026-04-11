import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "PayClaw API",
  description: "PayClaw class API reference — constructor, createWallet, loadWallet.",
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

function MethodSection({
  name,
  signature,
  description,
  children,
}: {
  name: string;
  signature: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-10 pb-10 border-b border-border last:border-b-0">
      <h3 className="text-xl font-semibold text-white mb-1">{name}</h3>
      <pre className="font-mono text-sm text-accent bg-surface-3 border border-border rounded-lg px-4 py-2 mb-3 overflow-x-auto">
        {signature}
      </pre>
      <p className="text-[#b0b0b0] mb-4 leading-7">{description}</p>
      {children}
    </div>
  );
}

const constructorCode = `import { PayClaw } from "@payclaw/sdk";

// Minimal — uses default public RPC
const payclaw = new PayClaw({ chain: "base" });

// Full config — custom RPC, bundler, paymaster
const payclaw = new PayClaw({
  chain: "base",
  rpcUrl: "https://base-mainnet.g.alchemy.com/v2/YOUR_KEY",
  bundlerUrl: "https://bundler.example.com",
  paymasterUrl: "https://paymaster.example.com",
});`;

const createWalletCode = `const wallet = await payclaw.createWallet({
  ownerPrivateKey: process.env.OWNER_KEY!,
  agentPrivateKey: process.env.AGENT_KEY!,
  policies: {
    dailyLimit: 1000,
    perTransactionLimit: 100,
    approvalThreshold: 50,
    allowedTokens: ["USDC"],
    allowedRecipients: [],
    swapsEnabled: true,
    allowedRouters: [],
    cooldownSeconds: 0,
  },
  salt: "my-unique-salt",  // optional — deterministic address
});

console.log(wallet.address); // "0x..."
console.log(wallet.chain);   // "base"`;

const loadWalletCode = `// Reconnect to an existing wallet
const wallet = await payclaw.loadWallet(
  "0x1234...abcd",  // wallet address
  {                   // policy config (must match on-chain)
    dailyLimit: 1000,
    perTransactionLimit: 100,
    approvalThreshold: 50,
    allowedTokens: ["USDC"],
  },
  {                   // optional keys (needed for tx signing)
    ownerPrivateKey: process.env.OWNER_KEY!,
    agentPrivateKey: process.env.AGENT_KEY!,
  },
);`;

export default function PayClawReferencePage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-12">
        <div className="flex items-center gap-2 text-xs font-mono text-muted mb-4">
          <Link href="/" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <Link href="/reference/payclaw" className="hover:text-white transition-colors">SDK Reference</Link>
          <span>/</span>
          <span className="text-accent">PayClaw</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">PayClaw</h1>
        <p className="text-lg text-[#999] leading-relaxed">
          The entry point for the SDK. Initialize with a chain, then create or load wallets.
        </p>
      </div>

      <div className="prose">
        <h2>Import</h2>
        <CodeBlock code={`import { PayClaw } from "@payclaw/sdk";`} />

        <h2>Methods</h2>
      </div>

      <div>
        <MethodSection
          name="constructor"
          signature="new PayClaw(config: PayClawConfig)"
          description="Creates a new PayClaw instance connected to the specified chain."
        >
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-muted font-medium">Parameter</th>
                  <th className="text-left py-2 pr-4 text-muted font-medium">Type</th>
                  <th className="text-left py-2 pr-4 text-muted font-medium">Required</th>
                  <th className="text-left py-2 pr-4 text-muted font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="text-[#b0b0b0]">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 text-white font-mono text-xs">config.chain</td>
                  <td className="py-2 pr-4 font-mono text-xs">ChainId</td>
                  <td className="py-2 pr-4 text-accent">Yes</td>
                  <td className="py-2 pr-4">&quot;base&quot; | &quot;base-sepolia&quot; | &quot;bsc&quot; | &quot;bsc-testnet&quot; | &quot;solana&quot; | &quot;solana-devnet&quot;</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 text-white font-mono text-xs">config.rpcUrl</td>
                  <td className="py-2 pr-4 font-mono text-xs">string</td>
                  <td className="py-2 pr-4">No</td>
                  <td className="py-2 pr-4">Custom RPC endpoint. Falls back to the chain default.</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 text-white font-mono text-xs">config.bundlerUrl</td>
                  <td className="py-2 pr-4 font-mono text-xs">string</td>
                  <td className="py-2 pr-4">No</td>
                  <td className="py-2 pr-4">ERC-4337 bundler URL (EVM only).</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-white font-mono text-xs">config.paymasterUrl</td>
                  <td className="py-2 pr-4 font-mono text-xs">string</td>
                  <td className="py-2 pr-4">No</td>
                  <td className="py-2 pr-4">Paymaster URL for gasless transactions (EVM only).</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-[#888] mb-4">
            Throws <code className="font-mono text-accent bg-surface-3 px-1 rounded text-xs">CHAIN_NOT_SUPPORTED</code> if the chain ID is invalid.
          </p>
          <CodeBlock code={constructorCode} />
        </MethodSection>

        <MethodSection
          name="createWallet"
          signature="async createWallet(config: WalletConfig): Promise<AgentWallet>"
          description="Deploys a new agent wallet smart contract on-chain and returns an AgentWallet instance."
        >
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-muted font-medium">Parameter</th>
                  <th className="text-left py-2 pr-4 text-muted font-medium">Type</th>
                  <th className="text-left py-2 pr-4 text-muted font-medium">Required</th>
                  <th className="text-left py-2 pr-4 text-muted font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="text-[#b0b0b0]">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 text-white font-mono text-xs">ownerPrivateKey</td>
                  <td className="py-2 pr-4 font-mono text-xs">string</td>
                  <td className="py-2 pr-4 text-accent">Yes</td>
                  <td className="py-2 pr-4">Owner private key (controls policies, approvals, withdrawals)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 text-white font-mono text-xs">agentPrivateKey</td>
                  <td className="py-2 pr-4 font-mono text-xs">string</td>
                  <td className="py-2 pr-4 text-accent">Yes</td>
                  <td className="py-2 pr-4">Agent private key (can only pay/swap within policy)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 text-white font-mono text-xs">policies</td>
                  <td className="py-2 pr-4 font-mono text-xs">PolicyConfig</td>
                  <td className="py-2 pr-4 text-accent">Yes</td>
                  <td className="py-2 pr-4">Spending rules. See <Link href="/concepts/policies" className="text-accent hover:underline">Policies</Link>.</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-white font-mono text-xs">salt</td>
                  <td className="py-2 pr-4 font-mono text-xs">string</td>
                  <td className="py-2 pr-4">No</td>
                  <td className="py-2 pr-4">CREATE2 salt for deterministic wallet address.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <CodeBlock code={createWalletCode} />
        </MethodSection>

        <MethodSection
          name="loadWallet"
          signature="async loadWallet(address: string, policies: PolicyConfig, keys?: Keys): Promise<AgentWallet>"
          description="Loads an existing wallet by address. Use this when reconnecting to a wallet created in a previous session."
        >
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-muted font-medium">Parameter</th>
                  <th className="text-left py-2 pr-4 text-muted font-medium">Type</th>
                  <th className="text-left py-2 pr-4 text-muted font-medium">Required</th>
                  <th className="text-left py-2 pr-4 text-muted font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="text-[#b0b0b0]">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 text-white font-mono text-xs">address</td>
                  <td className="py-2 pr-4 font-mono text-xs">string</td>
                  <td className="py-2 pr-4 text-accent">Yes</td>
                  <td className="py-2 pr-4">On-chain wallet address</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 text-white font-mono text-xs">policies</td>
                  <td className="py-2 pr-4 font-mono text-xs">PolicyConfig</td>
                  <td className="py-2 pr-4 text-accent">Yes</td>
                  <td className="py-2 pr-4">Policy config (should match on-chain state)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-white font-mono text-xs">keys</td>
                  <td className="py-2 pr-4 font-mono text-xs">{`{ ownerPrivateKey, agentPrivateKey }`}</td>
                  <td className="py-2 pr-4">No</td>
                  <td className="py-2 pr-4">Private keys for signing. Required for write operations.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <CodeBlock code={loadWalletCode} />
        </MethodSection>
      </div>

      <div className="prose">
        <h2>Properties</h2>
        <div className="overflow-x-auto mb-6 not-prose">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted font-medium">Property</th>
                <th className="text-left py-2 pr-4 text-muted font-medium">Type</th>
                <th className="text-left py-2 pr-4 text-muted font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-[#b0b0b0]">
              <tr>
                <td className="py-2 pr-4 text-white font-mono text-xs">chain</td>
                <td className="py-2 pr-4 font-mono text-xs">ChainId</td>
                <td className="py-2 pr-4">The chain this instance is connected to.</td>
              </tr>
            </tbody>
          </table>
        </div>
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
            href="/reference/policy-engine"
            className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-4 hover:border-[#333] hover:bg-surface-3 transition-colors group"
          >
            <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
              PolicyEngine API &rarr;
            </span>
            <span className="text-xs text-muted">Validation methods</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
