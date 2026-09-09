"use client";

import { AnalysisZone, AnalysisResult } from "@/types";

type Props = {
  analysis: AnalysisResult;
};

const ZONE_LABELS: Record<AnalysisZone, string> = {
  "under-eye": "Under-eye",
  forehead: "Forehead",
  cheeks: "Cheeks",
  jawline: "Jawline",
  "tone-texture": "Tone & texture",
};

// Diverging pair + neutral midpoint (brand: sage / warm gray / rose).
const COLOR = {
  improved: "#8A9A7B",
  neutral: "#C6B8A4",
  worsened: "#B87A7A",
} as const;

const GLYPH = { improved: "▲", neutral: "—", worsened: "▼" } as const;
const WORD = { improved: "Improved", neutral: "Neutral", worsened: "Worsened" } as const;

/**
 * Per-zone polarity: a diverging bar centred on a neutral axis, extending right
 * for improvement and left for regression. Length tracks confidence; direction
 * is also carried by a glyph + word so it never relies on colour alone.
 */
function ZoneRow({
  name,
  change,
  confidence,
  note,
}: AnalysisResult["zones"][number]) {
  const half = 50; // percent, each side of centre
  const magnitude = change === "neutral" ? 6 : 10 + confidence * (half - 12);
  const color = COLOR[change];

  return (
    <div className="py-2.5">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-[#1C1C1C]">
          {ZONE_LABELS[name]}
        </span>
        <span className="text-xs text-[#6B6560]">
          <span style={{ color }}>{GLYPH[change]}</span> {WORD[change]}
          <span className="text-[#9C958D]"> · {Math.round(confidence * 100)}%</span>
        </span>
      </div>
      <div
        className="relative h-2 rounded-full bg-[#F3F0EB]"
        role="img"
        aria-label={`${ZONE_LABELS[name]}: ${WORD[change]}, ${Math.round(
          confidence * 100,
        )}% confidence`}
      >
        <span className="absolute left-1/2 top-[-2px] h-[calc(100%+4px)] w-px bg-[#E8E2DA]" />
        <span
          className="absolute top-0 h-full rounded-full"
          style={{
            backgroundColor: color,
            width: `${magnitude}%`,
            left: change === "worsened" ? `${half - magnitude}%` : `${half}%`,
          }}
        />
      </div>
      <p className="mt-1 text-xs text-[#9C958D]">{note}</p>
    </div>
  );
}

export default function AnalysisSummary({ analysis }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[#1C1C1C]">Analysis summary</h3>

      {analysis.zones.length > 0 && (
        <div className="rounded-2xl border border-[#E8E2DA] bg-white p-4 divide-y divide-[#F3F0EB]">
          {analysis.zones.map((z) => (
            <ZoneRow key={z.name} {...z} />
          ))}
          <div className="flex items-center gap-4 pt-3 text-xs text-[#9C958D]">
            <span>
              <span style={{ color: COLOR.worsened }}>◀</span> regressed
            </span>
            <span>
              <span style={{ color: COLOR.improved }}>▶</span> improved
            </span>
            <span>bar length = confidence</span>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-[#E8E2DA] bg-white p-5">
        <p className="text-sm leading-relaxed text-[#1C1C1C]">{analysis.summary}</p>
      </div>

      <p className="text-xs italic text-[#9C958D]">{analysis.disclaimer}</p>
    </div>
  );
}
