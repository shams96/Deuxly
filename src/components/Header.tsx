"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { signOut } from "@/lib/signOut";
import { Button } from "@/components/ui/Button";
import ThemeToggle from "@/components/ThemeToggle";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/signup", label: "Sign Up" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-line">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-semibold tracking-tight text-ink">
              Deuxly
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "text-ink"
                    : "text-ink-2 hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            {status === "authenticated" && session?.user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-ink-2">
                  {session.user.name}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => signOut()}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link href="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            )}
          </div>

          <button
            type="button"
            className="md:hidden p-2 text-ink"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={24} aria-hidden /> : <Menu size={24} aria-hidden />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-line bg-bg">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === link.href
                    ? "text-ink bg-accent-soft"
                    : "text-ink-2 hover:text-ink"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {status === "authenticated" && session?.user ? (
              <button
                onClick={() => signOut()}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-ink-2 hover:text-ink"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/signup"
                className="block px-3 py-2 rounded-md text-base font-medium text-accent-ink hover:text-accent-ink"
                onClick={() => setIsOpen(false)}
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
