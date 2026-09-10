"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ComparisonSlider from "@/components/ComparisonSlider";
import AnalysisSummary from "@/components/AnalysisSummary";
import VisualOverlay from "@/components/VisualOverlay";
import ShareCard from "@/components/ShareCard";
import { useToast } from "@/components/Toast";
import type { AnalysisResult } from "@/types";
import { analyzeComparison, type OverlayZone } from "@/lib/compareImages";

type Photo = {
  id: string;
  storageUrl: string;
  label: string;
  capturedAt: string;
};

type Status = "loading" | "analyzing" | "done" | "no-face" | "error";

export default function ComparePage() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [photoA, setPhotoA] = useState<Photo | null>(null);
  const [photoB, setPhotoB] = useState<Photo | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [overlayZones, setOverlayZones] = useState<OverlayZone[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [showOverlay, setShowOverlay] = useState(true);
  const toast = useToast();
  const ranFor = useRef<string | null>(null);

  const isPremium = session?.user?.subscriptionStatus === "premium";

  const runAnalysis = useCallback(
    async (a: Photo, b: Photo, premium: boolean) => {
      const pairKey = `${a.id}:${b.id}:${premium}`;
      if (ranFor.current === pairKey) return;
      ranFor.current = pairKey;

      setStatus("analyzing");
      let output;
      try {
        output = await analyzeComparison(a.storageUrl, b.storageUrl, premium);
      } catch {
        setStatus("error");
        toast.addToast("Analysis failed", "error");
        return;
      }

      if (!output) {
        setStatus("no-face");
        toast.addToast(
          "Couldn't detect a face in one of the photos — showing side-by-side only.",
          "error",
        );
        return;
      }

      setAnalysis(output.result);
      setOverlayZones(output.overlay.zones);
      setStatus("done");

      try {
        const res = await fetch("/api/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            photoAId: a.id,
            photoBId: b.id,
            result: output.result,
          }),
        });
        if (!res.ok) throw new Error();
        toast.addToast("Analysis saved", "success");
      } catch {
        toast.addToast("Analysis ran but couldn't be saved", "error");
      }
    },
    [toast],
  );

  useEffect(() => {
    fetch("/api/photos")
      .then((r) => r.json())
      .then((data) => {
        const list: Photo[] = data.photos ?? [];
        const aId = searchParams.get("a");
        const bId = searchParams.get("b");
        const a = aId ? list.find((p) => p.id === aId) ?? null : null;
        const b = bId ? list.find((p) => p.id === bId) ?? null : null;
        setPhotoA(a);
        setPhotoB(b);
        if (a && b) {
          runAnalysis(a, b, session?.user?.subscriptionStatus === "premium");
        } else {
          setStatus("done");
        }
      })
      .catch(() => setStatus("error"));
    // Re-run when the pair or tier changes.
  }, [searchParams, session?.user?.subscriptionStatus, runAnalysis]);

  if (status === "loading") {
    return <div className="py-12 text-center text-ink-2">Loading…</div>;
  }

  if (!photoA || !photoB) {
    return (
      <div className="space-y-4">
        <h1 className="mb-1 text-2xl font-semibold text-ink">Compare</h1>
        <p className="text-sm text-ink-2">
          Select two photos from your history to compare.
        </p>
        <Link
          href="/dashboard/history"
          className="inline-block rounded-xl bg-accent px-6 py-3 font-medium text-on-fill transition-colors hover:bg-accent-strong"
        >
          Go to History
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-2xl font-semibold text-ink">Compare</h1>
        <p className="text-sm text-ink-2">
          {photoA.label} vs {photoB.label}
        </p>
      </div>

      <ComparisonSlider
        photoAUrl={photoA.storageUrl}
        photoBUrl={photoB.storageUrl}
        photoALabel={photoA.label}
        photoBLabel={photoB.label}
      />

      {status === "analyzing" && (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 text-sm text-ink-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          Analysing skin zones…
        </div>
      )}

      {status === "no-face" && (
        <div className="rounded-xl border border-line bg-surface-2 p-4 text-sm text-ink-2">
          Couldn&apos;t detect a face in one of these photos, so no zone analysis
          is available. The side-by-side comparison above still works.
        </div>
      )}

      {status === "done" && analysis && (
        <div className="space-y-4">
          {overlayZones.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-ink">
                  Zone analysis
                </h3>
                <button
                  onClick={() => setShowOverlay((v) => !v)}
                  className="text-sm text-accent-ink transition-colors hover:text-accent-ink"
                >
                  {showOverlay ? "Hide" : "Show"} overlay
                </button>
              </div>
              {showOverlay && (
                <VisualOverlay imageUrl={photoA.storageUrl} zones={overlayZones} />
              )}
            </>
          )}

          <AnalysisSummary analysis={analysis} />

          {!isPremium && (
            <p className="text-xs text-ink-3">
              Free plan shows a summary only.{" "}
              <Link
                href="/dashboard/settings?tab=subscription"
                className="font-medium text-accent-ink hover:text-accent-ink"
              >
                Upgrade
              </Link>{" "}
              for the zone-by-zone breakdown.
            </p>
          )}

          <ShareCard
            photoAUrl={photoA.storageUrl}
            photoBUrl={photoB.storageUrl}
            photoALabel={photoA.label}
            photoBLabel={photoB.label}
          />
        </div>
      )}
    </div>
  );
}
