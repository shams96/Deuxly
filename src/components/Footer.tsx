import Link from "next/link";

const LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="bg-ink py-12 text-bg/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <Link href="/" className="text-lg font-semibold text-bg">
              Deuxly
            </Link>
            <p className="text-sm">
              The second look at your skin — properly framed.
            </p>
          </div>
          <nav className="flex flex-wrap justify-center gap-6 text-sm" aria-label="Footer">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-bg">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-8 border-t border-bg/15 pt-8 text-center text-xs text-bg/70">
          © {new Date().getFullYear()} Deuxly. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
