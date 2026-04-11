import Link from "next/link";

const quickstartCode = `import { PayClaw } from "@payclaw/sdk";

const claw = new PayClaw({ apiKey: process.env.PAYCLAW_API_KEY });

// Create a wallet for your AI agent
const wallet = await claw.createWallet({
  name: "shopping-agent",
  policy: {
    maxPerTx: "50",     // $50 per transaction
    dailyLimit: "200",  // $200 per day
    requireApprovalAbove: "100", // human approval > $100
  },
});

// Agent makes a payment — policy enforced automatically
const tx = await wallet.pay({ to: vendor, amount: "12.50", token: "USDC" });`;

function CodeLine({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="leading-6">{children}</div>;
}

function K({ c }: { c: string }) {
  return <span className="text-[#cc99ff]">{c}</span>;
}
function S({ c }: { c: string }) {
  return <span className="text-[#99ff99]">{c}</span>;
}
function Cm({ c }: { c: string }) {
  return <span className="text-[#555]">{c}</span>;
}
function Fn({ c }: { c: string }) {
  return <span className="text-[#66ccff]">{c}</span>;
}
function Num({ c }: { c: string }) {
  return <span className="text-[#ffcc66]">{c}</span>;
}
function V({ c }: { c: string }) {
  return <span className="text-[#ff9966]">{c}</span>;
}
function Prop({ c }: { c: string }) {
  return <span className="text-[#e8e8e8]">{c}</span>;
}

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center overflow-hidden">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#00ff41 1px, transparent 1px), linear-gradient(90deg, #00ff41 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Badge */}
        <div className="relative mb-6 inline-flex items-center gap-2 rounded-full border border-[#00ff41]/20 bg-[#00ff41]/5 px-4 py-1.5 text-xs font-mono text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          Open Source · Apache 2.0 · v0.1.0
        </div>

        {/* Headline */}
        <h1 className="relative max-w-3xl text-5xl font-bold text-white leading-tight tracking-tight mb-6">
          Give your AI agent{" "}
          <span className="text-accent">a wallet</span>
        </h1>

        {/* Subtitle */}
        <p className="relative max-w-xl text-lg text-[#999] mb-10 leading-relaxed">
          Open-source SDK for AI agent payments with programmable rules and
          human oversight. Works with any chain, any model.
        </p>

        {/* CTAs */}
        <div className="relative flex flex-wrap gap-3 justify-center mb-16">
          <Link
            href="/quickstart"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-black hover:bg-accent-dim transition-colors"
          >
            Get Started
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <a
            href="https://github.com/payclaw"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-6 py-3 text-sm font-semibold text-white hover:border-[#444] hover:bg-surface-3 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            View on GitHub
          </a>
        </div>

        {/* Code block */}
        <div className="relative w-full max-w-3xl text-left">
          {/* Window chrome */}
          <div className="flex items-center gap-1.5 px-4 py-3 bg-surface-3 border border-border rounded-t-xl border-b-0">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            <span className="ml-3 font-mono text-xs text-muted">agent.ts</span>
          </div>

          {/* Code */}
          <div className="relative bg-surface-3 border border-border rounded-b-xl overflow-x-auto">
            <div className="absolute inset-y-0 left-0 w-px bg-accent/20" />
            <pre className="font-mono text-sm leading-6 p-5 pl-6">
              <CodeLine>
                <K c="import" /> {"{ "}<Fn c="PayClaw" />{" }"} <K c="from" /> <S c={'"@payclaw/sdk"'} />{";"}
              </CodeLine>
              <CodeLine>{" "}</CodeLine>
              <CodeLine>
                <K c="const" /> <V c="claw" /> {"= "}<K c="new" /> <Fn c="PayClaw" />{"({ "}<Prop c="apiKey" />{": process.env."}<V c="PAYCLAW_API_KEY" />{" });"}
              </CodeLine>
              <CodeLine>{" "}</CodeLine>
              <CodeLine>
                <Cm c="// Create a wallet for your AI agent" />
              </CodeLine>
              <CodeLine>
                <K c="const" /> <V c="wallet" /> {"= "}<K c="await" /> {"claw."}<Fn c="createWallet" />{"({"}
              </CodeLine>
              <CodeLine>
                {"  "}<Prop c="name" />{": "}<S c={'"shopping-agent"'} />{","}
              </CodeLine>
              <CodeLine>
                {"  "}<Prop c="policy" />{": {"}
              </CodeLine>
              <CodeLine>
                {"    "}<Prop c="maxPerTx" />{": "}<S c={'"50"'} />{","}<Cm c="     // $50 per transaction" />
              </CodeLine>
              <CodeLine>
                {"    "}<Prop c="dailyLimit" />{": "}<S c={'"200"'} />{","}<Cm c="  // $200 per day" />
              </CodeLine>
              <CodeLine>
                {"    "}<Prop c="requireApprovalAbove" />{": "}<S c={'"100"'} />{","}<Cm c=" // human approval > $100" />
              </CodeLine>
              <CodeLine>
                {"  },"}
              </CodeLine>
              <CodeLine>
                {"});"}
              </CodeLine>
              <CodeLine>{" "}</CodeLine>
              <CodeLine>
                <Cm c="// Agent makes a payment — policy enforced automatically" />
              </CodeLine>
              <CodeLine>
                <K c="const" /> <V c="tx" /> {"= "}<K c="await" /> {"wallet."}<Fn c="pay" />{"({ "}<Prop c="to" />{": vendor, "}<Prop c="amount" />{": "}<S c={'"12.50"'} />{", "}<Prop c="token" />{": "}<S c={'"USDC"'} />{" });"}
              </CodeLine>
            </pre>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="px-6 py-16 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: "⛓",
              title: "Any Chain",
              desc: "EVM-compatible chains today, Solana next. One SDK, multiple networks.",
            },
            {
              icon: "🛡",
              title: "Policy Engine",
              desc: "Per-tx limits, daily caps, token allowlists, and destination constraints — all on-chain.",
            },
            {
              icon: "👁",
              title: "Human Oversight",
              desc: "Configurable approval thresholds. Humans stay in the loop where it matters.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-surface-2 p-6 hover:border-[#333] transition-colors"
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-[#888] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Install strip */}
      <section className="px-6 pb-20 max-w-5xl mx-auto w-full">
        <div className="rounded-xl border border-[#00ff41]/20 bg-[#00ff41]/5 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white mb-1">Ready to start?</p>
            <p className="font-mono text-sm text-accent">npm install @payclaw/sdk</p>
          </div>
          <Link
            href="/quickstart"
            className="flex-shrink-0 inline-flex items-center gap-2 rounded-lg bg-accent/10 border border-accent/30 px-4 py-2 text-sm font-semibold text-accent hover:bg-accent/20 transition-colors"
          >
            Read the Quickstart
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
