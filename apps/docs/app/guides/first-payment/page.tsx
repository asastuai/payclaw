import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "First Payment",
  description: "Step-by-step guide from npm install to seeing a payment on BaseScan.",
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

export default function FirstPaymentPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-12">
        <div className="flex items-center gap-2 text-xs font-mono text-muted mb-4">
          <Link href="/" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <Link href="/guides/first-payment" className="hover:text-white transition-colors">Guides</Link>
          <span>/</span>
          <span className="text-accent">First Payment</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Your First Payment</h1>
        <p className="text-lg text-[#999] leading-relaxed">
          End-to-end walkthrough: from <code className="font-mono text-accent bg-surface-3 px-1.5 py-0.5 rounded text-sm">npm install</code> to
          seeing the transaction on BaseScan.
        </p>
      </div>

      <div>
        <Step n={1} title="Set up the project">
          <CodeBlock code={`mkdir my-agent && cd my-agent
npm init -y
npm install @payclaw/sdk typescript tsx
npx tsc --init`} lang="bash" />
          <p className="text-sm text-[#888] leading-relaxed">
            We use <code className="font-mono text-accent text-xs bg-surface-3 px-1.5 py-0.5 rounded">tsx</code> to
            run TypeScript directly without a build step.
          </p>
        </Step>

        <Step n={2} title="Generate two wallets">
          <p className="text-sm text-[#888] leading-relaxed mb-3">
            You need two private keys: one for the <strong className="text-white">owner</strong> (you)
            and one for the <strong className="text-white">agent</strong> (your AI). Use any wallet
            generator or run:
          </p>
          <CodeBlock code={`npx tsx -e "
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
const ownerKey = generatePrivateKey();
const agentKey = generatePrivateKey();
console.log('OWNER_KEY=' + ownerKey);
console.log('OWNER_ADDR=' + privateKeyToAccount(ownerKey).address);
console.log('AGENT_KEY=' + agentKey);
console.log('AGENT_ADDR=' + privateKeyToAccount(agentKey).address);
"`} lang="bash" />
          <p className="text-sm text-[#888] leading-relaxed mb-3">
            Save these to a <code className="font-mono text-accent text-xs bg-surface-3 px-1.5 py-0.5 rounded">.env</code> file:
          </p>
          <CodeBlock code={`OWNER_PRIVATE_KEY=0x...
AGENT_PRIVATE_KEY=0x...`} lang="bash" />
          <div className="rounded-lg border border-[#ff6666]/20 bg-[#ff6666]/5 px-4 py-3 text-sm text-[#ff6666] mb-4">
            <strong className="font-semibold">Security:</strong> Never commit private keys
            to git. Add <code className="font-mono bg-surface px-1 rounded">.env</code> to your <code className="font-mono bg-surface px-1 rounded">.gitignore</code>.
          </div>
        </Step>

        <Step n={3} title="Get testnet USDC">
          <p className="text-sm text-[#888] leading-relaxed mb-3">
            We will use <strong className="text-white">Base Sepolia</strong> testnet.
            Get test ETH from the{" "}
            <a href="https://www.alchemy.com/faucets/base-sepolia" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              Base Sepolia faucet
            </a>{" "}
            and testnet USDC from the{" "}
            <a href="https://faucet.circle.com/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              Circle faucet
            </a>.
            Send them to your <strong className="text-white">owner address</strong>.
          </p>
        </Step>

        <Step n={4} title="Create the agent script">
          <p className="text-sm text-[#888] leading-relaxed mb-3">
            Create <code className="font-mono text-accent text-xs bg-surface-3 px-1.5 py-0.5 rounded">agent.ts</code>:
          </p>
          <CodeBlock code={`import { PayClaw } from "@payclaw/sdk";

async function main() {
  // 1. Connect to Base Sepolia testnet
  const payclaw = new PayClaw({ chain: "base-sepolia" });

  // 2. Create the agent wallet
  console.log("Creating wallet...");
  const wallet = await payclaw.createWallet({
    ownerPrivateKey: process.env.OWNER_PRIVATE_KEY!,
    agentPrivateKey: process.env.AGENT_PRIVATE_KEY!,
    policies: {
      dailyLimit: 500,
      perTransactionLimit: 100,
      approvalThreshold: 50,
      allowedTokens: ["USDC"],
    },
  });
  console.log("Wallet address:", wallet.address);
  console.log("Chain:", wallet.chain);

  // 3. Fund the wallet — transfer USDC to wallet.address
  console.log("\\nFund the wallet with testnet USDC:");
  console.log(\`  Send USDC to: \${wallet.address}\`);
  console.log("  Then run this script again with FUNDED=1\\n");

  if (!process.env.FUNDED) return;

  // 4. Check balance
  const balances = await wallet.getBalances();
  console.log("Balances:", balances);

  // 5. Make a payment
  console.log("\\nSending payment...");
  const tx = await wallet.pay({
    to: "0x000000000000000000000000000000000000dEaD", // burn address for demo
    token: "USDC",
    amount: 1.00,
    memo: "First PayClaw payment!",
  });

  console.log("\\nTransaction complete!");
  console.log("  Hash:", tx.txHash);
  console.log("  Status:", tx.status);
  console.log("  Gas used:", tx.gasUsed?.toString());
  console.log(\`\\nView on BaseScan: https://sepolia.basescan.org/tx/\${tx.txHash}\`);

  // 6. Check remaining limits
  const limits = await wallet.getRemainingLimits();
  console.log("\\nRemaining limits:");
  console.log("  Daily:", limits.dailyRemaining, "of", limits.dailyLimit);
  console.log("  Per-tx max:", limits.perTransactionLimit);
  console.log("  Resets at:", limits.nextResetAt);
}

main().catch(console.error);`} />
        </Step>

        <Step n={5} title="Run it">
          <CodeBlock code={`# First run: create the wallet
npx tsx agent.ts

# Fund the wallet with testnet USDC (manual step)
# Then run again:
FUNDED=1 npx tsx agent.ts`} lang="bash" />
        </Step>

        <Step n={6} title="Verify on BaseScan">
          <p className="text-sm text-[#888] leading-relaxed">
            The script prints a BaseScan URL. Open it to see the on-chain transaction.
            You will see the USDC transfer from your agent wallet to the burn address,
            with the gas paid by the paymaster (gasless for the agent).
          </p>
          <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-accent mt-4">
            <strong className="font-semibold">Congratulations!</strong> Your AI agent just made
            its first autonomous payment, constrained by on-chain policy rules.
          </div>
        </Step>
      </div>

      <div className="border-t border-border pt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">
          Next steps
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/guides/spending-limits"
            className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-4 hover:border-[#333] hover:bg-surface-3 transition-colors group"
          >
            <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
              Spending Limits &rarr;
            </span>
            <span className="text-xs text-muted">Configure limit profiles</span>
          </Link>
          <Link
            href="/guides/human-approval"
            className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-4 hover:border-[#333] hover:bg-surface-3 transition-colors group"
          >
            <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
              Human Approval &rarr;
            </span>
            <span className="text-xs text-muted">Set up the approval workflow</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
