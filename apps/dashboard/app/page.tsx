import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
          PayClaw Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          AI Agent Wallet SDK — programmable rules, full control.
        </p>
      </div>

      {/* Connect wallet prompt */}
      <div className="card flex flex-col items-center justify-center py-16 text-center border-dashed">
        <div className="text-4xl mb-4 text-zinc-700" aria-hidden="true">◎</div>
        <h2 className="text-lg font-semibold text-zinc-300 mb-2">No wallet connected</h2>
        <p className="text-sm text-zinc-600 max-w-sm mb-6">
          Connect an owner wallet to manage agent wallets, review approvals, and
          monitor transactions in real time.
        </p>
        <button
          disabled
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
                     bg-accent-glow text-accent border border-accent/20 cursor-not-allowed opacity-60"
        >
          <span aria-hidden="true">◎</span>
          Connect Wallet
        </button>
        <p className="mt-3 text-xs text-zinc-700">Coming in Phase 3</p>
      </div>

      {/* Stats row — placeholder */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Agent Wallets",    value: "—" },
          { label: "Pending Approvals", value: "—" },
          { label: "Transactions (24h)", value: "—" },
          { label: "Total Volume",     value: "—" },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center py-5">
            <p className="text-2xl font-bold text-zinc-500 font-mono">{value}</p>
            <p className="text-xs text-zinc-600 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-zinc-700 pb-4">
        Full functionality coming in Phase 3
      </p>
    </div>
  );
}
