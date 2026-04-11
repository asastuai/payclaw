import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agent Wallets",
};

export default function WalletsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Agent Wallets</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage programmable wallets controlled by your AI agents.
          </p>
        </div>
        <button
          disabled
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium
                     bg-accent-glow text-accent border border-accent/20 cursor-not-allowed opacity-60"
        >
          + New Wallet
        </button>
      </div>

      <div className="card flex flex-col items-center justify-center py-16 text-center border-dashed">
        <div className="text-4xl mb-4 text-zinc-700" aria-hidden="true">◎</div>
        <h2 className="text-base font-semibold text-zinc-400 mb-1">No agent wallets yet</h2>
        <p className="text-sm text-zinc-600 max-w-xs">
          Create your first agent wallet to get started with programmable rules and spending limits.
        </p>
        <p className="mt-4 text-xs text-zinc-700">Coming in Phase 3</p>
      </div>
    </div>
  );
}
