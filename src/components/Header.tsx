"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";

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
    <header className="sticky top-0 z-50 bg-[#F9F7F4]/80 backdrop-blur-md border-b border-[#E8E2DA]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-semibold tracking-tight text-[#1C1C1C]">
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
                    ? "text-[#1C1C1C]"
                    : "text-[#6B6560] hover:text-[#1C1C1C]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {status === "authenticated" && session?.user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-[#6B6560]">
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
            className="md:hidden p-2 text-[#1C1C1C]"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-[#E8E2DA] bg-[#F9F7F4]">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === link.href
                    ? "text-[#1C1C1C] bg-[#EDE6DC]"
                    : "text-[#6B6560] hover:text-[#1C1C1C]"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {status === "authenticated" && session?.user ? (
              <button
                onClick={() => signOut()}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-[#6B6560] hover:text-[#1C1C1C]"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/signup"
                className="block px-3 py-2 rounded-md text-base font-medium text-[#C6B8A4] hover:text-[#B8A892]"
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
