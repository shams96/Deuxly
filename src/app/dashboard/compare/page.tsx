"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ComparisonSlider from "@/components/ComparisonSlider";
import AnalysisSummary from "@/components/AnalysisSummary";
import VisualOverlay from "@/components/VisualOverlay";
import ShareCard from "@/components/ShareCard";
import { useToast } from "@/components/Toast";
import type { AnalysisZone } from "@/types";

type Photo = {
  id: string;
  storageUrl: string;
  label: string;
  capturedAt: string;
};

type AnalysisResult = {
  zones: Array<{
    name: AnalysisZone;
    change: "improved" | "worsened" | "neutral";
    confidence: number;
    note: string;
  }>;
  summary: string;
  disclaimer: string;
};

export default function ComparePage() {
  const searchParams = useSearchParams();
  const [photoA, setPhotoA] = useState<Photo | null>(null);
  const [photoB, setPhotoB] = useState<Photo | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const toast = useToast();

  const generateAnalysis = useCallback(async (a: Photo, b: Photo) => {
    const res = await fetch("/api/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoAId: a.id, photoBId: b.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setAnalysis(data.analysis);
      toast.addToast("Analysis complete", "success");
    } else {
      toast.addToast("Analysis failed", "error");
    }
  }, [toast]);

  useEffect(() => {
    fetch("/api/photos")
      .then((r) => r.json())
      .then((data) => {
        const list = data.photos ?? [];
        const aId = searchParams.get("a");
        const bId = searchParams.get("b");
        if (aId && bId) {
          const a = list.find((p: Photo) => p.id === aId);
          const b = list.find((p: Photo) => p.id === bId);
          setPhotoA(a ?? null);
          setPhotoB(b ?? null);
          if (a && b) generateAnalysis(a, b);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [searchParams, generateAnalysis]);

  if (loading) return <div className="text-center text-[#6B6560] py-12">Loading...</div>;

  if (!photoA || !photoB) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-[#1C1C1C] mb-1">Compare</h1>
        <p className="text-sm text-[#6B6560]">Select two photos from your history to compare.</p>
        <Link
          href="/dashboard/history"
          className="inline-block px-6 py-3 rounded-xl bg-[#C6B8A4] text-white font-medium hover:bg-[#B8A892] transition-colors"
        >
          Go to History
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1C1C1C] mb-1">Compare</h1>
        <p className="text-sm text-[#6B6560]">
          {photoA.label} vs {photoB.label}
        </p>
      </div>

      <ComparisonSlider
        photoAUrl={photoA.storageUrl}
        photoBUrl={photoB.storageUrl}
        photoALabel={photoA.label}
        photoBLabel={photoB.label}
      />

      {analysis && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#1C1C1C]">Visual Analysis</h3>
            <button
              onClick={() => setShowOverlay(!showOverlay)}
              className="text-sm text-[#C6B8A4] hover:text-[#B8A892] transition-colors"
            >
              {showOverlay ? "Hide" : "Show"} Overlay
            </button>
          </div>

          {showOverlay && (
            <VisualOverlay
              analysis={analysis}
              imageWidth={1080}
              imageHeight={1350}
            />
          )}

          <AnalysisSummary analysis={analysis} />
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
