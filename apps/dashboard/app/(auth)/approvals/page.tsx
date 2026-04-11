import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Approvals",
};

export default function ApprovalsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Approvals</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Review and approve pending transactions that exceed agent spending rules.
        </p>
      </div>

      {/* Approval queue header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">Pending</span>
          <span className="badge-yellow">0</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled
            className="text-xs text-zinc-600 cursor-not-allowed px-2 py-1 rounded border border-surface-border hover:border-zinc-600 transition-colors"
          >
            Approve All
          </button>
          <button
            disabled
            className="text-xs text-zinc-600 cursor-not-allowed px-2 py-1 rounded border border-surface-border hover:border-zinc-600 transition-colors"
          >
            Reject All
          </button>
        </div>
      </div>

      <div className="card flex flex-col items-center justify-center py-16 text-center border-dashed">
        <div className="text-4xl mb-4 text-zinc-700" aria-hidden="true">◻</div>
        <h2 className="text-base font-semibold text-zinc-400 mb-1">No pending approvals</h2>
        <p className="text-sm text-zinc-600 max-w-xs">
          Transactions that require manual review will appear here. You can approve or
          reject individual requests or configure auto-approval rules.
        </p>
        <p className="mt-4 text-xs text-zinc-700">Coming in Phase 3</p>
      </div>
    </div>
  );
}
