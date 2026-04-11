import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AgentWallet API",
  description: "AgentWallet class API reference — pay, swap, approve, deny, and more.",
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

function MethodCard({
  name,
  role,
  signature,
  description,
  code,
}: {
  name: string;
  role: "agent" | "owner" | "read" | "events";
  signature: string;
  description: string;
  code: string;
}) {
  const roleColors = {
    agent: "text-[#66ccff] border-[#66ccff]/30 bg-[#66ccff]/5",
    owner: "text-[#ff9966] border-[#ff9966]/30 bg-[#ff9966]/5",
    read: "text-[#99ff99] border-[#99ff99]/30 bg-[#99ff99]/5",
    events: "text-[#cc99ff] border-[#cc99ff]/30 bg-[#cc99ff]/5",
  };

  return (
    <div className="mb-8 pb-8 border-b border-border last:border-b-0">
      <div className="flex items-center gap-3 mb-2">
        <h3 className="text-lg font-semibold text-white">{name}</h3>
        <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${roleColors[role]}`}>
          {role}
        </span>
      </div>
      <pre className="font-mono text-sm text-accent bg-surface-3 border border-border rounded-lg px-4 py-2 mb-3 overflow-x-auto">
        {signature}
      </pre>
      <p className="text-sm text-[#b0b0b0] mb-3 leading-relaxed">{description}</p>
      <CodeBlock code={code} />
    </div>
  );
}

export default function AgentWalletReferencePage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-12">
        <div className="flex items-center gap-2 text-xs font-mono text-muted mb-4">
          <Link href="/" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <Link href="/reference/agent-wallet" className="hover:text-white transition-colors">SDK Reference</Link>
          <span>/</span>
          <span className="text-accent">AgentWallet</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">AgentWallet</h1>
        <p className="text-lg text-[#999] leading-relaxed">
          The main object you interact with. Returned by <code className="font-mono text-accent bg-surface-3 px-1.5 py-0.5 rounded text-sm">createWallet()</code> and <code className="font-mono text-accent bg-surface-3 px-1.5 py-0.5 rounded text-sm">loadWallet()</code>.
        </p>
      </div>

      {/* Role legend */}
      <div className="flex flex-wrap gap-3 mb-10">
        <span className="text-xs font-mono px-2 py-0.5 rounded-full border text-[#66ccff] border-[#66ccff]/30 bg-[#66ccff]/5">agent = callable by agent</span>
        <span className="text-xs font-mono px-2 py-0.5 rounded-full border text-[#ff9966] border-[#ff9966]/30 bg-[#ff9966]/5">owner = callable by owner only</span>
        <span className="text-xs font-mono px-2 py-0.5 rounded-full border text-[#99ff99] border-[#99ff99]/30 bg-[#99ff99]/5">read = no transaction needed</span>
        <span className="text-xs font-mono px-2 py-0.5 rounded-full border text-[#cc99ff] border-[#cc99ff]/30 bg-[#cc99ff]/5">events = event subscription</span>
      </div>

      {/* Agent Actions */}
      <h2 className="text-2xl font-semibold text-white mb-6">Agent Actions</h2>

      <MethodCard
        name="pay"
        role="agent"
        signature="async pay(params: PayParams): Promise<TxReceipt>"
        description="Send a token payment to a recipient address. The policy engine validates the transaction before execution. If the amount exceeds the approval threshold, the transaction enters the approval queue."
        code={`const tx = await wallet.pay({
  to: "0x1234...abcd",
  token: "USDC",
  amount: 25.50,
  memo: "Invoice #1234",    // optional
});

// tx.status: "success" | "pending" | "failed"
// "pending" means it needs human approval
console.log(tx.txHash, tx.status, tx.usdValue);`}
      />

      <MethodCard
        name="swap"
        role="agent"
        signature="async swap(params: SwapParams): Promise<TxReceipt>"
        description="Swap one token for another using an approved DEX router. Requires swapsEnabled to be true in the policy config."
        code={`const tx = await wallet.swap({
  from: "USDC",
  to: "WETH",
  amount: 100,
  slippage: 0.5,  // 0.5% max slippage (optional)
});

console.log(tx.txHash, tx.status);`}
      />

      {/* Read Operations */}
      <h2 className="text-2xl font-semibold text-white mb-6 mt-12">Read Operations</h2>

      <MethodCard
        name="getBalances"
        role="read"
        signature="async getBalances(): Promise<TokenBalance[]>"
        description="Returns the wallet's token balances with USD values."
        code={`const balances = await wallet.getBalances();

for (const b of balances) {
  console.log(\`\${b.symbol}: \${b.balance} ($\${b.usdValue})\`);
}
// USDC: 450.00 ($450.00)
// WETH: 0.15 ($487.50)`}
      />

      <MethodCard
        name="getTransactions"
        role="read"
        signature="async getTransactions(opts?: TxQueryOpts): Promise<Transaction[]>"
        description="Returns the wallet's transaction history with optional filtering."
        code={`// Get last 20 transactions
const txs = await wallet.getTransactions({ limit: 20 });

// Filter by status
const pending = await wallet.getTransactions({
  status: "pending",
  limit: 10,
  offset: 0,
});

// Each transaction has: txHash, type, from, to, token,
// amount, usdValue, status, timestamp, memo`}
      />

      <MethodCard
        name="getRemainingLimits"
        role="read"
        signature="async getRemainingLimits(): Promise<LimitInfo>"
        description="Returns the current spending limits and how much has been spent today."
        code={`const limits = await wallet.getRemainingLimits();

console.log("Daily limit:", limits.dailyLimit);
console.log("Spent today:", limits.dailySpent);
console.log("Remaining:", limits.dailyRemaining);
console.log("Per-tx max:", limits.perTransactionLimit);
console.log("Approval above:", limits.approvalThreshold);
console.log("Resets at:", limits.nextResetAt);`}
      />

      {/* Owner Actions */}
      <h2 className="text-2xl font-semibold text-white mb-6 mt-12">Owner Actions</h2>

      <MethodCard
        name="approve"
        role="owner"
        signature="async approve(requestId: string): Promise<TxReceipt>"
        description="Approves a pending approval request. The payment executes immediately after approval. The policy is re-checked at approval time."
        code={`const receipt = await wallet.approve("req-abc123");
console.log(receipt.status); // "success"`}
      />

      <MethodCard
        name="deny"
        role="owner"
        signature="async deny(requestId: string): Promise<TxReceipt>"
        description="Denies a pending approval request. The funds remain in the wallet."
        code={`const receipt = await wallet.deny("req-abc123");
console.log(receipt.status); // "success"`}
      />

      <MethodCard
        name="updatePolicies"
        role="owner"
        signature="async updatePolicies(policies: PolicyConfig): Promise<TxReceipt>"
        description="Updates the wallet's policy configuration on-chain. Takes effect immediately."
        code={`const receipt = await wallet.updatePolicies({
  dailyLimit: 2000,
  perTransactionLimit: 200,
  approvalThreshold: 100,
  allowedTokens: ["USDC", "USDT"],
  swapsEnabled: true,
});

console.log("Policies updated:", receipt.txHash);`}
      />

      <MethodCard
        name="revokeAgent"
        role="owner"
        signature="async revokeAgent(): Promise<TxReceipt>"
        description="Permanently disables the agent key. After revocation, only the owner can interact with the wallet. This is irreversible."
        code={`const receipt = await wallet.revokeAgent();
console.log("Agent revoked:", receipt.txHash);
// Agent can no longer call pay() or swap()`}
      />

      <MethodCard
        name="emergencyWithdraw"
        role="owner"
        signature="async emergencyWithdraw(token: string): Promise<TxReceipt>"
        description="Transfers the entire balance of a token from the wallet to the owner address. Use in emergency situations."
        code={`const receipt = await wallet.emergencyWithdraw("USDC");
console.log("Funds withdrawn:", receipt.txHash);`}
      />

      {/* Events */}
      <h2 className="text-2xl font-semibold text-white mb-6 mt-12">Events</h2>

      <MethodCard
        name="on"
        role="events"
        signature="on<T extends PayClawEventType>(event: T, handler: EventHandler<T>): Unsubscribe"
        description="Subscribe to wallet events. Returns an unsubscribe function."
        code={`// Subscribe
const unsub = wallet.on("payment:executed", (event) => {
  console.log("Payment:", event.tx.txHash);
});

// Later: unsubscribe
unsub();`}
      />

      {/* Properties */}
      <h2 className="text-2xl font-semibold text-white mb-6 mt-12">Properties</h2>

      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-4 text-muted font-medium">Property</th>
              <th className="text-left py-2 pr-4 text-muted font-medium">Type</th>
              <th className="text-left py-2 pr-4 text-muted font-medium">Description</th>
            </tr>
          </thead>
          <tbody className="text-[#b0b0b0]">
            <tr className="border-b border-border/50">
              <td className="py-2 pr-4 text-white font-mono text-xs">address</td>
              <td className="py-2 pr-4 font-mono text-xs">string</td>
              <td className="py-2 pr-4">The on-chain wallet address.</td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="py-2 pr-4 text-white font-mono text-xs">chain</td>
              <td className="py-2 pr-4 font-mono text-xs">ChainId</td>
              <td className="py-2 pr-4">The chain the wallet is deployed on.</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 text-white font-mono text-xs">policies</td>
              <td className="py-2 pr-4 font-mono text-xs">Required&lt;PolicyConfig&gt;</td>
              <td className="py-2 pr-4">Current policy config with defaults filled in.</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Types */}
      <h2 className="text-2xl font-semibold text-white mb-4 mt-12">Types</h2>

      <CodeBlock code={`interface PayParams {
  to: string;        // recipient address
  token: string;     // token symbol (e.g. "USDC")
  amount: number;    // amount in USD value
  memo?: string;     // optional memo/tag
}

interface SwapParams {
  from: string;      // source token
  to: string;        // destination token
  amount: number;    // amount of source token
  slippage?: number; // max slippage percentage
}

interface TxReceipt {
  txHash: string;
  status: "success" | "failed" | "pending";
  chain: ChainId;
  gasUsed?: bigint;
  usdValue?: number;
  timestamp: Date;
}

interface TokenBalance {
  token: string;
  symbol: string;
  balance: string;
  usdValue: number;
  decimals: number;
}

interface LimitInfo {
  dailyLimit: number;
  dailySpent: number;
  dailyRemaining: number;
  perTransactionLimit: number;
  approvalThreshold: number;
  nextResetAt: Date;
}`} />

      <div className="border-t border-border pt-10 mt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/reference/policy-engine"
            className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-4 hover:border-[#333] hover:bg-surface-3 transition-colors group"
          >
            <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
              PolicyEngine API &rarr;
            </span>
            <span className="text-xs text-muted">Validation methods</span>
          </Link>
          <Link
            href="/reference/events"
            className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-4 hover:border-[#333] hover:bg-surface-3 transition-colors group"
          >
            <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
              Events &rarr;
            </span>
            <span className="text-xs text-muted">All event types and handlers</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
