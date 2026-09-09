import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#1C1C1C] text-[#9C958D] py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <Link
              href="/"
              className="text-lg font-semibold text-[#F9F7F4]"
            >
              Deuxly
            </Link>
            <p className="text-sm">
              The second look at your skin — properly framed.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link
              href="/privacy"
              className="hover:text-[#F9F7F4] transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-[#F9F7F4] transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/contact"
              className="hover:text-[#F9F7F4] transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-[#2a2a2a] text-center text-xs text-[#6B6560]">
          © {new Date().getFullYear()} Deuxly. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
