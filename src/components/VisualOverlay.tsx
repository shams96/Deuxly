"use client";

import { AnalysisZone, AnalysisResult } from "@/types";

type Props = {
  analysis: AnalysisResult;
  imageWidth: number;
  imageHeight: number;
};

const ZONE_COLORS: Record<string, string> = {
  improved: "rgba(138,154,123,0.3)",
  worsened: "rgba(184,122,122,0.3)",
  neutral: "rgba(198,184,164,0.2)",
};

const ZONE_POSITIONS: Record<AnalysisZone, { x: number; y: number; w: number; h: number }> = {
  "under-eye": { x: 30, y: 55, w: 40, h: 15 },
  forehead: { x: 25, y: 10, w: 50, h: 25 },
  cheeks: { x: 20, y: 45, w: 60, h: 25 },
  jawline: { x: 25, y: 75, w: 50, h: 20 },
  "tone-texture": { x: 15, y: 15, w: 70, h: 70 },
};

export default function VisualOverlay({ analysis, imageWidth, imageHeight }: Props) {
  return (
    <div className="relative w-full" style={{ aspectRatio: `${imageWidth}/${imageHeight}` }}>
      <svg
        viewBox={`0 0 ${imageWidth} ${imageHeight}`}
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
      >
        {analysis.zones.map((zone) => (
          <rect
            key={zone.name}
            x={ZONE_POSITIONS[zone.name].x}
            y={ZONE_POSITIONS[zone.name].y}
            width={ZONE_POSITIONS[zone.name].w}
            height={ZONE_POSITIONS[zone.name].h}
            fill={ZONE_COLORS[zone.change]}
            stroke={zone.change === "improved" ? "#8A9A7B" : zone.change === "worsened" ? "#B87A7A" : "#C6B8A4"}
            strokeWidth="2"
            rx="8"
          />
        ))}
      </svg>

      <div className="mt-3 flex flex-wrap gap-2">
        {analysis.zones.map((zone) => (
          <span
            key={zone.name}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-[#E8E2DA]"
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: zone.change === "improved" ? "#8A9A7B" : zone.change === "worsened" ? "#B87A7A" : "#C6B8A4" }}
            />
            {zone.name}
          </span>
        ))}
      </div>
    </div>
  );
}
