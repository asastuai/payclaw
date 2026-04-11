import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transactions",
};

export default function TransactionsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Transactions</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Real-time feed of all transactions executed by your agent wallets.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {["All", "Sent", "Received", "Failed"].map((filter) => (
          <button
            key={filter}
            disabled
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-not-allowed
              ${filter === "All"
                ? "bg-accent-glow text-accent border border-accent/20"
                : "text-zinc-600 border border-surface-border"
              }`}
          >
            {filter}
          </button>
        ))}
        <span className="ml-auto text-xs text-zinc-700">— 0 transactions</span>
      </div>

      {/* Table header */}
      <div className="card p-0 overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_120px_100px] gap-4 px-4 py-2.5 border-b border-surface-border text-xs text-zinc-600 font-medium uppercase tracking-wider">
          <span>Transaction</span>
          <span>Amount</span>
          <span>Date</span>
          <span>Status</span>
        </div>
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="text-3xl mb-3 text-zinc-700" aria-hidden="true">↯</div>
          <p className="text-sm text-zinc-600">No transactions recorded yet</p>
          <p className="mt-3 text-xs text-zinc-700">Coming in Phase 3</p>
        </div>
      </div>
    </div>
  );
}
