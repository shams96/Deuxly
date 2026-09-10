"use client";

import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
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
  improved: "var(--color-success)",
  neutral: "var(--color-accent)",
  worsened: "var(--color-danger)",
} as const;

const GLYPH = {
  improved: TrendingUp,
  neutral: Minus,
  worsened: TrendingDown,
} as const;
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
  const Glyph = GLYPH[change];

  return (
    <div className="py-2.5">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-ink">
          {ZONE_LABELS[name]}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-ink-2">
          <Glyph size={13} style={{ color }} aria-hidden />
          {WORD[change]}
          <span className="text-ink-3"> · {Math.round(confidence * 100)}%</span>
        </span>
      </div>
      <div
        className="relative h-2 rounded-full bg-surface-2"
        role="img"
        aria-label={`${ZONE_LABELS[name]}: ${WORD[change]}, ${Math.round(
          confidence * 100,
        )}% confidence`}
      >
        <span className="absolute left-1/2 top-[-2px] h-[calc(100%+4px)] w-px bg-line" />
        <span
          className="absolute top-0 h-full rounded-full"
          style={{
            backgroundColor: color,
            width: `${magnitude}%`,
            left: change === "worsened" ? `${half - magnitude}%` : `${half}%`,
          }}
        />
      </div>
      <p className="mt-1 text-xs text-ink-3">{note}</p>
    </div>
  );
}

export default function AnalysisSummary({ analysis }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-ink">Analysis summary</h3>

      {analysis.zones.length > 0 && (
        <div className="rounded-2xl border border-line bg-surface p-4 divide-y divide-surface-2">
          {analysis.zones.map((z) => (
            <ZoneRow key={z.name} {...z} />
          ))}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 text-xs text-ink-3">
            <span className="inline-flex items-center gap-1">
              <ArrowLeft size={12} style={{ color: COLOR.worsened }} aria-hidden />
              regressed
            </span>
            <span className="inline-flex items-center gap-1">
              <ArrowRight size={12} style={{ color: COLOR.improved }} aria-hidden />
              improved
            </span>
            <span>bar length = confidence</span>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-line bg-surface p-5">
        <p className="text-sm leading-relaxed text-ink">{analysis.summary}</p>
      </div>

      <p className="text-xs italic text-ink-3">{analysis.disclaimer}</p>
    </div>
  );
}
