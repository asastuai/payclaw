export default function PlaygroundPage() {
  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] overflow-hidden">
      {/* ── Phase banner ── */}
      <div className="flex items-center justify-center gap-2 bg-[#00ff41]/10 border-b border-[#00ff41]/20 px-4 py-2 shrink-0">
        <span className="inline-block w-2 h-2 rounded-full bg-[#00ff41] animate-pulse" />
        <span className="text-xs font-mono text-[#00ff41] tracking-widest uppercase">
          Interactive Playground — Coming in Phase 3
        </span>
      </div>

      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-[#2a2a2a] bg-[#111111] shrink-0">
        {/* Left: logo + title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
          </div>
          <span className="text-sm font-mono text-[#e8e8e8] font-semibold tracking-tight">
            payclaw
            <span className="text-[#00ff41]">/</span>
            playground
          </span>
        </div>

        {/* Center: chain selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1.5 cursor-not-allowed opacity-70">
            <span className="w-2 h-2 rounded-full bg-[#00ff41]" />
            <span className="text-xs font-mono text-[#e8e8e8]">base-sepolia</span>
            <svg className="w-3 h-3 text-[#666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2">
          <button
            disabled
            className="flex items-center gap-2 rounded border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1.5 text-xs font-mono text-[#666] cursor-not-allowed"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>
          <button
            disabled
            className="flex items-center gap-2 rounded border border-[#00ff41]/40 bg-[#00ff41]/10 px-4 py-1.5 text-xs font-mono font-semibold text-[#00ff41] cursor-not-allowed shadow-[0_0_12px_rgba(0,255,65,0.15)]"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Run
          </button>
        </div>
      </header>

      {/* ── Main split layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Code editor (60%) ── */}
        <div className="flex flex-col w-[60%] border-r border-[#2a2a2a] bg-[#0d0d0d] overflow-hidden">
          {/* Editor tab bar */}
          <div className="flex items-center gap-0 border-b border-[#2a2a2a] shrink-0">
            <div className="flex items-center gap-2 px-4 py-2 border-r border-[#2a2a2a] border-b-2 border-b-[#00ff41] bg-[#0d0d0d]">
              <svg className="w-3.5 h-3.5 text-[#569cd6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span className="text-xs font-mono text-[#e8e8e8]">example.ts</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 opacity-40">
              <span className="text-xs font-mono text-[#666]">wallet-policies.ts</span>
            </div>
          </div>

          {/* Line numbers + code */}
          <div className="flex flex-1 overflow-auto">
            {/* Line numbers */}
            <div className="select-none px-3 pt-5 pb-5 text-right font-mono text-xs text-[#3a3a3a] leading-6 shrink-0 border-r border-[#1e1e1e] min-w-[3rem]">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Code content */}
            <pre className="flex-1 px-5 pt-5 pb-5 font-mono text-sm leading-6 overflow-x-auto">
              {/* Line 1 */}
              <div>
                <span className="token-keyword">import</span>
                <span className="text-[#e8e8e8]"> {"{ "}</span>
                <span className="token-type">PayClaw</span>
                <span className="text-[#e8e8e8]">{" }"} </span>
                <span className="token-keyword">from</span>
                <span className="text-[#e8e8e8]"> </span>
                <span className="token-string">&apos;@payclaw/sdk&apos;</span>
                <span className="text-[#808080]">;</span>
              </div>

              {/* Line 2 — blank */}
              <div>&nbsp;</div>

              {/* Line 3 */}
              <div>
                <span className="token-keyword">const</span>
                <span className="text-[#e8e8e8]"> </span>
                <span className="token-const">payclaw</span>
                <span className="text-[#e8e8e8]"> = </span>
                <span className="token-keyword">new</span>
                <span className="text-[#e8e8e8]"> </span>
                <span className="token-type">PayClaw</span>
                <span className="text-[#808080]">({"{"}</span>
                <span className="text-[#e8e8e8]"> chain</span>
                <span className="text-[#808080]">:</span>
                <span className="text-[#e8e8e8]"> </span>
                <span className="token-string">&apos;base-sepolia&apos;</span>
                <span className="text-[#e8e8e8]"> </span>
                <span className="text-[#808080]">{"}"});</span>
              </div>

              {/* Line 4 — blank */}
              <div>&nbsp;</div>

              {/* Line 5 */}
              <div>
                <span className="token-keyword">const</span>
                <span className="text-[#e8e8e8]"> </span>
                <span className="token-const">wallet</span>
                <span className="text-[#e8e8e8]"> = </span>
                <span className="token-keyword">await</span>
                <span className="text-[#e8e8e8]"> payclaw.</span>
                <span className="token-fn">createWallet</span>
                <span className="text-[#808080]">({"{"}</span>
              </div>

              {/* Line 6 */}
              <div>
                <span className="text-[#e8e8e8]">{"  "}</span>
                <span className="token-prop">policies</span>
                <span className="text-[#808080]">:</span>
                <span className="text-[#e8e8e8]"> </span>
                <span className="text-[#808080]">{"{"}</span>
              </div>

              {/* Line 7 */}
              <div>
                <span className="text-[#e8e8e8]">{"    "}</span>
                <span className="token-prop">dailyLimit</span>
                <span className="text-[#808080]">:</span>
                <span className="text-[#e8e8e8]"> </span>
                <span className="token-number">1000</span>
                <span className="text-[#808080]">,</span>
              </div>

              {/* Line 8 */}
              <div>
                <span className="text-[#e8e8e8]">{"    "}</span>
                <span className="token-prop">perTransactionLimit</span>
                <span className="text-[#808080]">:</span>
                <span className="text-[#e8e8e8]"> </span>
                <span className="token-number">100</span>
                <span className="text-[#808080]">,</span>
              </div>

              {/* Line 9 */}
              <div>
                <span className="text-[#e8e8e8]">{"  "}</span>
                <span className="text-[#808080]">{"},"}</span>
              </div>

              {/* Line 10 */}
              <div>
                <span className="text-[#808080]">{"});"}</span>
              </div>

              {/* Line 11 — blank */}
              <div>&nbsp;</div>

              {/* Line 12 */}
              <div>
                <span className="token-const">console</span>
                <span className="text-[#808080]">.</span>
                <span className="token-fn">log</span>
                <span className="text-[#808080]">(</span>
                <span className="token-string">&apos;Wallet:&apos;</span>
                <span className="text-[#808080]">,</span>
                <span className="text-[#e8e8e8]"> wallet.</span>
                <span className="token-prop">address</span>
                <span className="text-[#808080]">);</span>
              </div>

              {/* Line 13 — blank */}
              <div>&nbsp;</div>

              {/* Line 14 */}
              <div>
                <span className="token-keyword">const</span>
                <span className="text-[#e8e8e8]"> </span>
                <span className="token-const">receipt</span>
                <span className="text-[#e8e8e8]"> = </span>
                <span className="token-keyword">await</span>
                <span className="text-[#e8e8e8]"> wallet.</span>
                <span className="token-fn">pay</span>
                <span className="text-[#808080]">({"{"}</span>
              </div>

              {/* Line 15 */}
              <div>
                <span className="text-[#e8e8e8]">{"  "}</span>
                <span className="token-prop">to</span>
                <span className="text-[#808080]">:</span>
                <span className="text-[#e8e8e8]"> </span>
                <span className="token-string">&apos;0xCoffeeMerchant...&apos;</span>
                <span className="text-[#808080]">,</span>
              </div>

              {/* Line 16 */}
              <div>
                <span className="text-[#e8e8e8]">{"  "}</span>
                <span className="token-prop">token</span>
                <span className="text-[#808080]">:</span>
                <span className="text-[#e8e8e8]"> </span>
                <span className="token-string">&apos;USDC&apos;</span>
                <span className="text-[#808080]">,</span>
              </div>

              {/* Line 17 */}
              <div>
                <span className="text-[#e8e8e8]">{"  "}</span>
                <span className="token-prop">amount</span>
                <span className="text-[#808080]">:</span>
                <span className="text-[#e8e8e8]"> </span>
                <span className="token-number">4.50</span>
                <span className="text-[#808080]">,</span>
              </div>

              {/* Line 18 */}
              <div>
                <span className="text-[#e8e8e8]">{"  "}</span>
                <span className="token-prop">memo</span>
                <span className="text-[#808080]">:</span>
                <span className="text-[#e8e8e8]"> </span>
                <span className="token-string">&apos;Morning coffee&apos;</span>
                <span className="text-[#808080]">,</span>
              </div>

              {/* Line 19 */}
              <div>
                <span className="text-[#808080]">{"});"}</span>
              </div>

              {/* Lines 20-24 blank / padding */}
              <div>&nbsp;</div>
              <div>&nbsp;</div>
              <div>&nbsp;</div>
              <div>&nbsp;</div>
              <div>&nbsp;</div>
            </pre>
          </div>
        </div>

        {/* ── RIGHT: panels (40%) ── */}
        <div className="flex flex-col w-[40%] overflow-hidden">

          {/* ── Wallet State card (top half) ── */}
          <div className="flex flex-col flex-1 border-b border-[#2a2a2a] overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#2a2a2a] bg-[#111111] shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00ff41]" />
                <span className="text-xs font-mono text-[#e8e8e8] font-medium uppercase tracking-wider">
                  Wallet State
                </span>
              </div>
              <span className="text-xs font-mono text-[#3a3a3a]">base-sepolia</span>
            </div>

            {/* Wallet data */}
            <div className="flex-1 overflow-auto p-4 space-y-3 bg-[#0f0f0f]">
              {/* Address row */}
              <div className="rounded border border-[#2a2a2a] bg-[#1a1a1a] p-3 space-y-1">
                <span className="text-[10px] font-mono text-[#444] uppercase tracking-widest">Address</span>
                <p className="text-xs font-mono text-[#00ff41] break-all">
                  0x71C7656EC7ab88b098defB751B7401B5f6d8976F
                </p>
              </div>

              {/* Balance row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded border border-[#2a2a2a] bg-[#1a1a1a] p-3 space-y-1">
                  <span className="text-[10px] font-mono text-[#444] uppercase tracking-widest">Balance</span>
                  <p className="text-xl font-mono font-bold text-[#e8e8e8]">
                    1,000.00
                  </p>
                  <p className="text-[10px] font-mono text-[#00ff41]">USDC</p>
                </div>
                <div className="rounded border border-[#2a2a2a] bg-[#1a1a1a] p-3 space-y-1">
                  <span className="text-[10px] font-mono text-[#444] uppercase tracking-widest">ETH</span>
                  <p className="text-xl font-mono font-bold text-[#e8e8e8]">
                    0.042
                  </p>
                  <p className="text-[10px] font-mono text-[#569cd6]">ETH</p>
                </div>
              </div>

              {/* Policies */}
              <div className="rounded border border-[#2a2a2a] bg-[#1a1a1a] p-3 space-y-2">
                <span className="text-[10px] font-mono text-[#444] uppercase tracking-widest">Active Policies</span>
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#666]">dailyLimit</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1 rounded-full bg-[#2a2a2a] overflow-hidden">
                        <div className="h-full w-[4%] rounded-full bg-[#00ff41]" />
                      </div>
                      <span className="text-xs font-mono text-[#e8e8e8]">
                        <span className="text-[#00ff41]">4.50</span>
                        <span className="text-[#444]"> / 1000</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#666]">perTxLimit</span>
                    <span className="text-xs font-mono text-[#e8e8e8]">100 USDC</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#666]">status</span>
                    <span className="flex items-center gap-1 text-xs font-mono text-[#00ff41]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00ff41] animate-pulse inline-block" />
                      active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Output console (bottom half) ── */}
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Console header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#2a2a2a] bg-[#111111] shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ffbd2e]" />
                <span className="text-xs font-mono text-[#e8e8e8] font-medium uppercase tracking-wider">
                  Output
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#3a3a3a]">3 lines</span>
            </div>

            {/* Console output */}
            <div className="flex-1 overflow-auto p-4 bg-[#080808] font-mono text-xs space-y-1.5">
              <div className="flex gap-2">
                <span className="text-[#3a3a3a] select-none">›</span>
                <span className="text-[#444]">Running example.ts...</span>
              </div>
              <div className="flex gap-2">
                <span className="text-[#3a3a3a] select-none">›</span>
                <span className="text-[#666]">
                  Wallet:{" "}
                  <span className="text-[#00ff41]">
                    0x71C7656EC7ab88b098defB751B7401B5f6d8976F
                  </span>
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-[#3a3a3a] select-none">›</span>
                <span className="text-[#666]">
                  tx:{" "}
                  <span className="text-[#569cd6]">
                    0xabc123def456...
                  </span>
                  {" "}
                  <span className="text-[#00ff41]">✓ confirmed</span>
                </span>
              </div>
              <div className="flex gap-2 pt-1">
                <span className="text-[#3a3a3a] select-none">›</span>
                <span className="text-[#00ff41]">
                  Payment of 4.50 USDC sent to 0xCoffeeMerchant
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-[#3a3a3a] select-none">›</span>
                <span className="text-[#444]">
                  Daily spend: 4.50 / 1000 USDC
                </span>
              </div>
              {/* Blinking cursor */}
              <div className="flex gap-2 pt-1">
                <span className="text-[#00ff41] select-none">_</span>
                <span className="animate-pulse text-[#00ff41]">▋</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
