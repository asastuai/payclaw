import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Chains",
  description: "Multi-chain support in PayClaw — Base, BSC, and Solana.",
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

const baseCode = `import { PayClaw } from "@payclaw/sdk";

// Base mainnet
const payclaw = new PayClaw({ chain: "base" });

// Base Sepolia testnet
const testclaw = new PayClaw({ chain: "base-sepolia" });`;

const bscCode = `// BSC mainnet
const payclaw = new PayClaw({ chain: "bsc" });

// BSC testnet
const testclaw = new PayClaw({ chain: "bsc-testnet" });`;

const solanaCode = `// Solana mainnet
const payclaw = new PayClaw({ chain: "solana" });

// Solana devnet
const testclaw = new PayClaw({ chain: "solana-devnet" });`;

const rpcCode = `// Use a custom RPC endpoint (recommended for production)
const payclaw = new PayClaw({
  chain: "base",
  rpcUrl: "https://base-mainnet.g.alchemy.com/v2/YOUR_KEY",
  bundlerUrl: "https://bundler.example.com",    // ERC-4337 bundler
  paymasterUrl: "https://paymaster.example.com", // gasless txs
});`;

const multiChainCode = `// Create wallets on multiple chains
const baseClaw = new PayClaw({ chain: "base" });
const bscClaw = new PayClaw({ chain: "bsc" });

const baseWallet = await baseClaw.createWallet({ /* ... */ });
const bscWallet = await bscClaw.createWallet({ /* ... */ });

// Same API — different chains
await baseWallet.pay({ to: "0x...", token: "USDC", amount: 25 });
await bscWallet.pay({ to: "0x...", token: "USDT", amount: 25 });`;

export default function ChainsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-12">
        <div className="flex items-center gap-2 text-xs font-mono text-muted mb-4">
          <Link href="/" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <Link href="/concepts/chains" className="hover:text-white transition-colors">Concepts</Link>
          <span>/</span>
          <span className="text-accent">Chains</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Chains</h1>
        <p className="text-lg text-[#999] leading-relaxed">
          One SDK, multiple networks. PayClaw supports EVM chains and Solana.
        </p>
      </div>

      <div className="prose">
        <h2>Supported chains</h2>
        <div className="overflow-x-auto mb-6 not-prose">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted font-medium">Chain ID</th>
                <th className="text-left py-2 pr-4 text-muted font-medium">Name</th>
                <th className="text-left py-2 pr-4 text-muted font-medium">Type</th>
                <th className="text-left py-2 pr-4 text-muted font-medium">EVM Chain ID</th>
                <th className="text-left py-2 pr-4 text-muted font-medium">Testnet</th>
                <th className="text-left py-2 pr-4 text-muted font-medium">Explorer</th>
              </tr>
            </thead>
            <tbody className="text-[#b0b0b0]">
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-accent font-mono text-xs">base</td>
                <td className="py-2 pr-4 text-white">Base</td>
                <td className="py-2 pr-4">EVM</td>
                <td className="py-2 pr-4">8453</td>
                <td className="py-2 pr-4">No</td>
                <td className="py-2 pr-4"><a href="https://basescan.org" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">basescan.org</a></td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-accent font-mono text-xs">base-sepolia</td>
                <td className="py-2 pr-4 text-white">Base Sepolia</td>
                <td className="py-2 pr-4">EVM</td>
                <td className="py-2 pr-4">84532</td>
                <td className="py-2 pr-4">Yes</td>
                <td className="py-2 pr-4"><a href="https://sepolia.basescan.org" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">sepolia.basescan.org</a></td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-accent font-mono text-xs">bsc</td>
                <td className="py-2 pr-4 text-white">BNB Smart Chain</td>
                <td className="py-2 pr-4">EVM</td>
                <td className="py-2 pr-4">56</td>
                <td className="py-2 pr-4">No</td>
                <td className="py-2 pr-4"><a href="https://bscscan.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">bscscan.com</a></td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-accent font-mono text-xs">bsc-testnet</td>
                <td className="py-2 pr-4 text-white">BSC Testnet</td>
                <td className="py-2 pr-4">EVM</td>
                <td className="py-2 pr-4">97</td>
                <td className="py-2 pr-4">Yes</td>
                <td className="py-2 pr-4"><a href="https://testnet.bscscan.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">testnet.bscscan.com</a></td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 text-accent font-mono text-xs">solana</td>
                <td className="py-2 pr-4 text-white">Solana</td>
                <td className="py-2 pr-4">Solana</td>
                <td className="py-2 pr-4">-</td>
                <td className="py-2 pr-4">No</td>
                <td className="py-2 pr-4"><a href="https://explorer.solana.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">explorer.solana.com</a></td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-accent font-mono text-xs">solana-devnet</td>
                <td className="py-2 pr-4 text-white">Solana Devnet</td>
                <td className="py-2 pr-4">Solana</td>
                <td className="py-2 pr-4">-</td>
                <td className="py-2 pr-4">Yes</td>
                <td className="py-2 pr-4"><a href="https://explorer.solana.com?cluster=devnet" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">explorer.solana.com</a></td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>Chain configuration</h2>

        <h3>Base (recommended)</h3>
        <p>
          Base is a Layer 2 built on Ethereum with low fees and fast confirmation times.
          It is the recommended chain for getting started. The ERC-4337 EntryPoint is
          deployed at the standard v0.7 address.
        </p>
        <CodeBlock code={baseCode} />

        <h3>BSC</h3>
        <p>
          BNB Smart Chain offers high throughput and low fees. Use the same SDK interface,
          just change the chain ID.
        </p>
        <CodeBlock code={bscCode} />

        <h3>Solana</h3>
        <p>
          Solana uses a different runtime (Anchor programs instead of Solidity contracts).
          The SDK abstracts this completely. The API is identical.
        </p>
        <CodeBlock code={solanaCode} />

        <h2>Custom RPC endpoints</h2>
        <p>
          For production use, provide your own RPC URL from Alchemy, Infura, QuickNode,
          or a dedicated node. You can also configure a custom ERC-4337 bundler and paymaster
          for gasless transactions.
        </p>
        <CodeBlock code={rpcCode} />

        <h2>Multi-chain wallets</h2>
        <p>
          Create separate <code>PayClaw</code> instances for each chain. Each wallet is
          chain-specific. The API is identical across chains.
        </p>
        <CodeBlock code={multiChainCode} />

        <h2>What is the same across chains</h2>
        <ul>
          <li>SDK interface (<code>createWallet</code>, <code>pay</code>, <code>swap</code>, etc.)</li>
          <li>Policy model (daily limits, per-tx limits, approvals, allowlists)</li>
          <li>Event types and handlers</li>
          <li>TypeScript types and return shapes</li>
        </ul>

        <h2>What differs across chains</h2>
        <ul>
          <li><strong>Contract type:</strong> EVM chains use Solidity + ERC-4337; Solana uses Anchor programs</li>
          <li><strong>Token addresses:</strong> USDC on Base vs USDC on BSC are different contract addresses (handled by the SDK)</li>
          <li><strong>Gas model:</strong> EVM chains use gas + optional paymaster; Solana uses compute units + priority fees</li>
          <li><strong>Block explorers:</strong> Different URLs per chain (available in the chain config)</li>
          <li><strong>Finality:</strong> Each chain has different confirmation times</li>
        </ul>
      </div>

      <div className="border-t border-border pt-10 mt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/reference/payclaw"
            className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-4 hover:border-[#333] hover:bg-surface-3 transition-colors group"
          >
            <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
              PayClaw API &rarr;
            </span>
            <span className="text-xs text-muted">Constructor and chain config reference</span>
          </Link>
          <Link
            href="/guides/first-payment"
            className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-4 hover:border-[#333] hover:bg-surface-3 transition-colors group"
          >
            <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
              First Payment Guide &rarr;
            </span>
            <span className="text-xs text-muted">End-to-end walkthrough on Base Sepolia</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
