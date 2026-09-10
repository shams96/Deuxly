"use client";

import { signOut } from "@/lib/signOut";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

const navItems = [
  { href: "/dashboard", label: "Timeline", icon: "timeline" },
  { href: "/dashboard/capture", label: "Capture", icon: "capture" },
  { href: "/dashboard/history", label: "History", icon: "history" },
  { href: "/dashboard/compare", label: "Compare", icon: "compare" },
  { href: "/dashboard/analyses", label: "Analyses", icon: "analyses" },
  { href: "/dashboard/settings", label: "Settings", icon: "settings" },
];

export default function DashboardNav({ user }: { user: { name?: string | null; email?: string | null; image?: string | null; subscriptionStatus?: string } }) {
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-surface border-r border-line flex-col">
        <div className="p-6 border-b border-line">
          <h1 className="text-xl font-semibold text-ink">Deuxly</h1>
          <p className="text-sm text-ink-3 mt-1">
            {user.name || user.email}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1" aria-label="Primary">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-surface-2 text-ink"
                  : "text-ink-2 hover:bg-surface-2 hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-line flex items-center gap-2">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ink-2 hover:bg-surface-2 hover:text-ink transition-colors"
          >
            Sign out
          </button>
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-surface border-b border-line z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold text-ink">Deuxly</h1>
          <div className="flex items-center gap-1">
          <ThemeToggle />
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              aria-label="Menu"
              aria-expanded={showMenu}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-2 transition-colors"
            >
              <svg className="w-5 h-5 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 bg-overlay z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-surface rounded-xl shadow-lg border border-line py-2 z-50">
                  <div className="px-4 py-2 border-b border-line">
                    <p className="text-sm font-medium text-ink">
                      {user.name || user.email}
                    </p>
                    <p className="text-xs text-ink-3 mt-0.5 capitalize">
                      {user.subscriptionStatus || "Free"} plan
                    </p>
                  </div>
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setShowMenu(false)}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      className={`block px-4 py-3 text-sm transition-colors ${
                        isActive(item.href)
                          ? "text-ink font-medium bg-surface-2"
                          : "text-ink-2"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="border-t border-line mt-2 pt-2">
                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="w-full text-left px-4 py-3 text-sm text-ink-2 hover:text-ink transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-line z-40" aria-label="Primary">
        <div className="flex items-center justify-around">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`flex flex-col items-center justify-center py-2 px-3 min-h-[60px] min-w-[60px] transition-colors ${
                isActive(item.href)
                  ? "text-ink"
                  : "text-ink-3"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
