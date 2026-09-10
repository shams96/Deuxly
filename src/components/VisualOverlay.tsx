"use client";

import Image from "next/image";
import type { AnalysisZone } from "@/types";
import type { OverlayZone } from "@/lib/compareImages";

type Props = {
  /** Image the zones were measured against (baseline / photo A). */
  imageUrl: string;
  zones: OverlayZone[];
};

const STROKE: Record<OverlayZone["change"], string> = {
  improved: "var(--color-success)",
  worsened: "var(--color-danger)",
  neutral: "var(--color-accent)",
};
const FILL: Record<OverlayZone["change"], string> = {
  improved: "color-mix(in srgb, var(--color-success) 22%, transparent)",
  worsened: "color-mix(in srgb, var(--color-danger) 22%, transparent)",
  neutral: "color-mix(in srgb, var(--color-accent) 16%, transparent)",
};

const LABEL: Record<AnalysisZone, string> = {
  "under-eye": "Under-eye",
  forehead: "Forehead",
  cheeks: "Cheeks",
  jawline: "Jawline",
  "tone-texture": "Tone & texture",
};

export default function VisualOverlay({ imageUrl, zones }: Props) {
  if (zones.length === 0) return null;

  return (
    <div>
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-bg shadow-sm">
        <Image src={imageUrl} alt="Analysed baseline" fill className="object-cover" />
        <svg
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          {zones.map((z) => (
            <polygon
              key={z.name}
              points={z.polygon.map((p) => `${p.x},${p.y}`).join(" ")}
              fill={FILL[z.change]}
              stroke={STROKE[z.change]}
              strokeWidth={0.004}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {zones.map((z) => (
          <span
            key={z.name}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: STROKE[z.change] }}
            />
            {LABEL[z.name]}
          </span>
        ))}
      </div>
    </div>
  );
}
