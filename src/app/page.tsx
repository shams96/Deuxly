"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";

const STEPS = [
  {
    n: "01",
    title: "Capture, standardized",
    body: "On-device face guidance lines up distance, framing and lighting so every photo is comparable — not just a selfie.",
  },
  {
    n: "02",
    title: "Build a timeline",
    body: "Your captures stay private and organized. Label them, add notes, and watch the weeks stack up.",
  },
  {
    n: "03",
    title: "Compare and understand",
    body: "Pick any two dates. Deuxly aligns the faces, evens out the lighting, and shows per-zone changes in texture, tone and redness.",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    features: [
      "4 captures per month",
      "30-day history",
      "Side-by-side compare",
      "Overall change summary",
    ],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Premium",
    price: "$—/mo",
    features: [
      "Unlimited captures",
      "History kept forever",
      "Five-zone breakdown + confidence",
      "Visual overlays & high-res export",
    ],
    cta: "Start free, upgrade anytime",
    highlight: true,
  },
];

function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 pt-20 pb-16 text-center sm:px-6 sm:pt-28">
          <Reveal>
            <p className="mb-4 text-sm font-medium uppercase tracking-wide text-ink-3">
              Skin progress, properly framed
            </p>
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-6xl">
              The second look at your skin
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-2">
              A calm, private way to track how your skin actually changes over
              weeks — with standardized photos and honest, zone-by-zone
              comparison.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/signup">
                <Button size="lg">Get started</Button>
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium text-ink-2 hover:text-ink"
              >
                I already have an account
              </Link>
            </div>
          </Reveal>
        </section>

        <section className="border-t border-line bg-surface/60">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
            <Reveal>
              <h2 className="text-2xl font-semibold tracking-[-0.01em] text-ink">
                How it works
              </h2>
            </Reveal>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i * 0.06}>
                  <div className="h-full rounded-2xl border border-line bg-surface p-6">
                    <span className="text-sm font-semibold text-accent-ink">
                      {s.n}
                    </span>
                    <h3 className="mt-2 font-medium text-ink">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-2">
                      {s.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
            <Reveal>
              <h2 className="text-2xl font-semibold tracking-[-0.01em] text-ink">
                Private by design
              </h2>
              <p className="mx-auto mt-4 max-w-xl leading-relaxed text-ink-2">
                Face detection and image analysis run in your browser — the raw
                comparison never leaves your device. Photos are stored privately,
                served only to you, and you can delete your account and every
                image in two steps, permanently.
              </p>
              <p className="mx-auto mt-4 max-w-xl text-xs text-ink-3">
                Deuxly is a personal tracking tool. Its analysis is an
                approximate visual estimate, never medical or diagnostic.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="border-t border-line bg-surface/60">
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
            <Reveal>
              <h2 className="text-2xl font-semibold tracking-[-0.01em] text-ink">
                Simple pricing
              </h2>
            </Reveal>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {PLANS.map((p, i) => (
                <Reveal key={p.name} delay={i * 0.06}>
                  <div
                    className={`h-full rounded-2xl border p-6 ${
                      p.highlight
                        ? "border-accent bg-surface shadow-sm"
                        : "border-line bg-surface"
                    }`}
                  >
                    <div className="flex items-baseline justify-between">
                      <h3 className="font-semibold text-ink">{p.name}</h3>
                      <span className="text-sm text-ink-2">{p.price}</span>
                    </div>
                    <ul className="mt-4 space-y-2">
                      {p.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-2 text-sm text-ink-2"
                        >
                          <span aria-hidden className="mt-0.5 text-success-ink">
                            ✓
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href="/signup" className="mt-6 block">
                      <Button
                        variant={p.highlight ? "primary" : "outline"}
                        className="w-full"
                      >
                        {p.cta}
                      </Button>
                    </Link>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
            <Reveal>
              <h2 className="text-3xl font-semibold tracking-[-0.02em] text-ink">
                Start your first capture today
              </h2>
              <p className="mt-3 text-ink-2">
                It takes about a minute, and next month you&apos;ll be glad you
                have a baseline.
              </p>
              <Link href="/signup" className="mt-6 inline-block">
                <Button size="lg">Create your account</Button>
              </Link>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
