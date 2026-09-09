"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Analysis = {
  id: string;
  photoAId: string;
  photoBId: string;
  analysis: {
    zones: Array<{
      name: string;
      change: "improved" | "worsened" | "neutral";
      confidence: number;
      note: string;
    }>;
    summary: string;
    disclaimer: string;
  } | null;
  createdAt: string;
};

export default function AnalysesPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/compare")
      .then((r) => r.json())
      .then((data) => {
        setAnalyses(data.analyses ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1C1C1C] mb-1">Analyses</h1>
        <p className="text-sm text-[#6B6560]">
          {analyses.length} analysis{analyses.length !== 1 ? "s" : ""}
        </p>
      </div>

      {loading ? (
        <div className="text-center text-[#6B6560] py-12">Loading...</div>
      ) : analyses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg
            className="w-16 h-16 text-[#E8E2DA] mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M18.75 6.75h.008v.008h-.008V6.75zm-3.75 0h.008v.008h-.008V6.75zm-3.75 0h.008v.008h-.008V6.75z"
            />
          </svg>
          <h3 className="text-lg font-medium text-[#1C1C1C] mb-2">No analyses yet</h3>
          <p className="text-sm text-[#6B6560] mb-6 max-w-xs">
            Select two photos from your history to run your first comparison.
          </p>
          <Link
            href="/dashboard/history"
            className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-[#C6B8A4] text-white font-medium hover:bg-[#B8A892] transition-colors"
          >
            Go to History
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {analyses.map((analysis) => (
            <div
              key={analysis.id}
              className="p-5 rounded-2xl bg-white border border-[#E8E2DA]"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-[#1C1C1C]">
                    Analysis
                  </p>
                  <p className="text-xs text-[#9C958D]">
                    {new Date(analysis.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Link
                  href={`/dashboard/compare?a=${analysis.photoAId}&b=${analysis.photoBId}`}
                  className="text-sm font-medium text-[#C6B8A4] hover:text-[#B8A892] transition-colors"
                >
                  View
                </Link>
              </div>
              {analysis.analysis && analysis.analysis.zones.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {analysis.analysis.zones.map((zone, i) => (
                    <div
                      key={`${zone.name}-${i}`}
                      className="p-3 rounded-xl bg-[#F9F7F4]"
                    >
                      <p className="text-xs text-[#6B6560] capitalize">
                        {zone.name.replace(/-/g, " ")}
                      </p>
                      <p className="text-sm font-medium text-[#1C1C1C]">
                        {Math.round(zone.confidence * 100)}% confidence
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#6B6560]">
                  {analysis.analysis?.summary ?? "Summary only."}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
