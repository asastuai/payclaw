"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/",             icon: "◈", label: "Dashboard"    },
  { href: "/wallets",      icon: "◎", label: "Wallets"      },
  { href: "/approvals",    icon: "◻", label: "Approvals"    },
  { href: "/transactions", icon: "↯", label: "Transactions" },
  { href: "/settings",     icon: "◆", label: "Settings"     },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col h-full border-r border-surface-border bg-surface-muted">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-surface-border shrink-0">
        <Link href="/" className="flex items-center gap-2 group">
          <span
            className="text-xl text-accent group-hover:drop-shadow-[0_0_6px_rgba(0,255,65,0.6)] transition-all duration-200"
            aria-hidden="true"
          >
            ◇
          </span>
          <span className="font-semibold text-sm tracking-wide text-zinc-100">
            PayClaw
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Main navigation">
        {NAV_ITEMS.map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`nav-link ${isActive(href) ? "active" : ""}`}
            aria-current={isActive(href) ? "page" : undefined}
          >
            <span className="nav-icon w-4 text-center text-base leading-none" aria-hidden="true">
              {icon}
            </span>
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-surface-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-slow" />
          <span className="text-xs text-zinc-600 font-mono">v0.1.0-alpha</span>
        </div>
        <p className="text-xs text-zinc-700 mt-1">
          payclaw.dev
        </p>
      </div>
    </aside>
  );
}
