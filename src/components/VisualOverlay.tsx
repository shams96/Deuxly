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
  improved: "#8A9A7B",
  worsened: "#B87A7A",
  neutral: "#C6B8A4",
};
const FILL: Record<OverlayZone["change"], string> = {
  improved: "rgba(138,154,123,0.22)",
  worsened: "rgba(184,122,122,0.22)",
  neutral: "rgba(198,184,164,0.16)",
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
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#F9F7F4] shadow-sm">
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
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E2DA] bg-white px-2.5 py-1 text-xs font-medium"
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
