import type { Metadata } from "next";

type Props = {
  params: { id: string };
};

export function generateMetadata({ params }: Props): Metadata {
  return { title: `Wallet ${params.id}` };
}

export default function WalletDetailPage({ params }: Props) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-zinc-600 mb-2 font-mono">
          <span>Wallets</span>
          <span>/</span>
          <span className="text-zinc-400">{params.id}</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Wallet Detail</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Rules, spending limits, and transaction history for this agent wallet.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {["Balance", "Spending Rules", "Transactions"].map((label) => (
          <div key={label} className="card text-center py-8">
            <p className="text-2xl font-bold text-zinc-700 font-mono">—</p>
            <p className="text-xs text-zinc-600 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="card flex flex-col items-center justify-center py-12 text-center border-dashed">
        <p className="text-sm text-zinc-600">Full wallet detail view coming in Phase 3</p>
        <p className="mt-1 text-xs text-zinc-700 font-mono">id: {params.id}</p>
      </div>
    </div>
  );
}
