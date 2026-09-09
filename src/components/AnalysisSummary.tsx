"use client";

import { AnalysisZone, AnalysisResult } from "@/types";

type Props = {
  analysis: AnalysisResult;
};

const ZONE_LABELS: Record<AnalysisZone, string> = {
  "under-eye": "Under-Eye",
  forehead: "Forehead",
  cheeks: "Cheeks",
  jawline: "Jawline",
  "tone-texture": "Tone & Texture",
};

export default function AnalysisSummary({ analysis }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[#1C1C1C]">Analysis Summary</h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {analysis.zones.map((zone) => (
          <div
            key={zone.name}
            className="p-4 rounded-2xl bg-white border border-[#E8E2DA]"
          >
            <p className="text-xs text-[#6B6560] uppercase tracking-wider mb-1">
              {ZONE_LABELS[zone.name]}
            </p>
            <p
              className={`text-sm font-medium ${
                zone.change === "improved"
                  ? "text-[#8A9A7B]"
                  : zone.change === "worsened"
                  ? "text-[#B87A7A]"
                  : "text-[#6B6560]"
              }`}
            >
              {zone.change === "improved"
                ? "Improved"
                : zone.change === "worsened"
                ? "Worsened"
                : "Neutral"}
            </p>
            <p className="text-xs text-[#9C958D] mt-1">
              {Math.round(zone.confidence * 100)}% confidence
            </p>
          </div>
        ))}
      </div>

      <div className="p-5 rounded-2xl bg-white border border-[#E8E2DA]">
        <p className="text-sm text-[#1C1C1C] leading-relaxed">{analysis.summary}</p>
      </div>

      <p className="text-xs text-[#9C958D] italic">{analysis.disclaimer}</p>
    </div>
  );
}
