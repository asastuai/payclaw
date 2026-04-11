import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PayClaw Docs",
    template: "%s — PayClaw Docs",
  },
  description: "Open-source SDK for AI agent payments with programmable rules and human oversight.",
  openGraph: {
    title: "PayClaw Docs",
    description: "Give your AI agent a wallet.",
    siteName: "PayClaw",
  },
};

const nav = [
  {
    section: "Getting Started",
    links: [
      { label: "Quickstart", href: "/quickstart" },
    ],
  },
  {
    section: "Concepts",
    links: [
      { label: "Agent Wallets", href: "/concepts/agent-wallets" },
      { label: "Policies", href: "/concepts/policies" },
      { label: "Approvals", href: "/concepts/approvals" },
      { label: "Chains", href: "/concepts/chains" },
    ],
  },
  {
    section: "SDK Reference",
    links: [
      { label: "PayClaw", href: "/reference/payclaw" },
      { label: "AgentWallet", href: "/reference/agent-wallet" },
      { label: "PolicyEngine", href: "/reference/policy-engine" },
      { label: "Events", href: "/reference/events" },
    ],
  },
  {
    section: "Guides",
    links: [
      { label: "First Payment", href: "/guides/first-payment" },
      { label: "Spending Limits", href: "/guides/spending-limits" },
      { label: "Human Approval", href: "/guides/human-approval" },
      { label: "Multi-chain", href: "/guides/multi-chain" },
    ],
  },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface text-[#e8e8e8]">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="hidden md:flex w-64 flex-shrink-0 flex-col border-r border-border bg-surface-2 sticky top-0 h-screen overflow-y-auto">
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-6 py-5 border-b border-border">
              <span className="text-accent font-mono font-bold text-lg">⌗</span>
              <Link href="/" className="font-semibold text-white tracking-tight hover:text-accent transition-colors">
                PayClaw
              </Link>
              <span className="ml-auto text-xs text-muted font-mono bg-surface-3 px-1.5 py-0.5 rounded">
                v0.1
              </span>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 py-5 space-y-6">
              {nav.map((group) => (
                <div key={group.section}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted px-2 mb-2">
                    {group.section}
                  </p>
                  <ul className="space-y-0.5">
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="flex items-center px-2 py-1.5 text-sm text-[#999] rounded-md hover:text-white hover:bg-surface-3 transition-colors"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>

            {/* Footer links */}
            <div className="px-6 py-4 border-t border-border space-y-2">
              <a
                href="https://github.com/payclaw"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-muted hover:text-white transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                GitHub
              </a>
              <a
                href="https://npmjs.com/package/@payclaw/sdk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-muted hover:text-white transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474C23.214 24 24 23.214 24 22.237V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z" />
                </svg>
                npm
              </a>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
