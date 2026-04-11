import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Multi-chain",
  description: "Deploy and manage agent wallets across multiple chains.",
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

export default function MultiChainPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-12">
        <div className="flex items-center gap-2 text-xs font-mono text-muted mb-4">
          <Link href="/" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <Link href="/guides/multi-chain" className="hover:text-white transition-colors">Guides</Link>
          <span>/</span>
          <span className="text-accent">Multi-chain</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Multi-chain Deployment</h1>
        <p className="text-lg text-[#999] leading-relaxed">
          Run agent wallets on Base, BSC, and Solana from the same codebase.
        </p>
      </div>

      <div className="prose">
        <h2>One SDK, multiple chains</h2>
        <p>
          Each <code>PayClaw</code> instance is bound to a single chain. To operate on
          multiple chains, create one instance per chain. The API is identical everywhere.
        </p>
        <CodeBlock code={`import { PayClaw } from "@payclaw/sdk";

// Create instances for each chain
const base = new PayClaw({ chain: "base" });
const bsc = new PayClaw({ chain: "bsc" });
const solana = new PayClaw({ chain: "solana" });

// Create wallets on each
const baseWallet = await base.createWallet({
  ownerPrivateKey: process.env.OWNER_KEY!,
  agentPrivateKey: process.env.AGENT_KEY!,
  policies: { dailyLimit: 1000, perTransactionLimit: 100, approvalThreshold: 50 },
});

const bscWallet = await bsc.createWallet({
  ownerPrivateKey: process.env.OWNER_KEY!,
  agentPrivateKey: process.env.AGENT_KEY!,
  policies: { dailyLimit: 1000, perTransactionLimit: 100, approvalThreshold: 50 },
});`} />

        <h2>Cross-chain routing</h2>
        <p>
          PayClaw does not (yet) support native cross-chain transfers. Each wallet operates
          on its deployed chain. To move funds between chains, use a bridge separately
          and then fund the target wallet.
        </p>

        <h2>Chain-specific configuration</h2>
        <p>
          For production, use dedicated RPC endpoints per chain:
        </p>
        <CodeBlock code={`const base = new PayClaw({
  chain: "base",
  rpcUrl: process.env.BASE_RPC_URL!,
  bundlerUrl: process.env.BASE_BUNDLER_URL!,
  paymasterUrl: process.env.BASE_PAYMASTER_URL!,
});

const bsc = new PayClaw({
  chain: "bsc",
  rpcUrl: process.env.BSC_RPC_URL!,
  bundlerUrl: process.env.BSC_BUNDLER_URL!,
});`} />

        <h2>Unified monitoring</h2>
        <p>
          Listen to events from all wallets in a single handler:
        </p>
        <CodeBlock code={`function setupMonitoring(wallet: AgentWallet) {
  wallet.on("payment:executed", (e) => {
    console.log(\`[\${wallet.chain}] Payment: \${e.tx.txHash}\`);
  });
  wallet.on("approval:pending", (e) => {
    console.log(\`[\${wallet.chain}] Approval needed: \${e.request.id}\`);
  });
}

setupMonitoring(baseWallet);
setupMonitoring(bscWallet);`} />

        <h2>Testing on testnets</h2>
        <p>
          Use the testnet chain IDs during development:
        </p>
        <div className="overflow-x-auto mb-6 not-prose">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted font-medium">Mainnet</th>
                <th className="text-left py-2 pr-4 text-muted font-medium">Testnet</th>
                <th className="text-left py-2 pr-4 text-muted font-medium">Faucet</th>
              </tr>
            </thead>
            <tbody className="text-[#b0b0b0]">
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-accent font-mono text-xs">base</td>
                <td className="py-2 pr-4 font-mono text-xs">base-sepolia</td>
                <td className="py-2 pr-4"><a href="https://www.alchemy.com/faucets/base-sepolia" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Alchemy faucet</a></td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-accent font-mono text-xs">bsc</td>
                <td className="py-2 pr-4 font-mono text-xs">bsc-testnet</td>
                <td className="py-2 pr-4"><a href="https://testnet.bnbchain.org/faucet-smart" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">BNB faucet</a></td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-accent font-mono text-xs">solana</td>
                <td className="py-2 pr-4 font-mono text-xs">solana-devnet</td>
                <td className="py-2 pr-4"><a href="https://faucet.solana.com/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Solana faucet</a></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="border-t border-border pt-10 mt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/concepts/chains"
            className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-4 hover:border-[#333] hover:bg-surface-3 transition-colors group"
          >
            <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
              Chains Reference &rarr;
            </span>
            <span className="text-xs text-muted">Full chain table and config</span>
          </Link>
          <Link
            href="/reference/payclaw"
            className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-4 hover:border-[#333] hover:bg-surface-3 transition-colors group"
          >
            <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
              PayClaw API &rarr;
            </span>
            <span className="text-xs text-muted">Constructor and chain config</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
