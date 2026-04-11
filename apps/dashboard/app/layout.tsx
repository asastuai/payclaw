import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "../components/sidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | PayClaw",
    default: "PayClaw Dashboard",
  },
  description: "AI Agent Wallet SDK — programmable rules, full control.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className="bg-[#0a0a0a] text-zinc-100 antialiased">
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <Sidebar />

          {/* Main content */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Top bar */}
            <header className="h-14 border-b border-surface-border flex items-center justify-between px-6 shrink-0">
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <span className="text-zinc-600">/</span>
                <span>Dashboard</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="badge-green">Phase 2</span>
                <div className="w-8 h-8 rounded-full bg-surface-raised border border-surface-border flex items-center justify-center text-xs text-zinc-400">
                  JR
                </div>
              </div>
            </header>

            {/* Page content */}
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
