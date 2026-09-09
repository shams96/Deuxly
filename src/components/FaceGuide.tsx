"use client";

import React from "react";

interface FaceGuideProps {
  faceSize: number;
  isAligned: boolean;
  isGazing: boolean;
  isNeutral: boolean;
}

export default function FaceGuide({ faceSize, isAligned, isGazing, isNeutral }: FaceGuideProps) {
  const distanceText = faceSize === 0 ? "No face detected" : faceSize < 100 ? "Move closer" : faceSize > 280 ? "Move back" : "Good distance";
  const distanceColor = faceSize === 0 ? "text-[#9C958D]" : faceSize > 80 && faceSize < 300 ? "text-[#8A9A7B]" : "text-[#C4A484]";

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <svg width="260" height="340" viewBox="0 0 260 340">
            <ellipse
              cx="130"
              cy="170"
              rx="110"
              ry="150"
              fill="none"
              stroke={isAligned ? "#8A9A7B" : "#C6B8A4"}
              strokeWidth="2"
              strokeDasharray={isAligned ? "none" : "6 4"}
              opacity="0.9"
            />
          </svg>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative w-4 h-4">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-[#C6B8A4]" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#C6B8A4]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#C6B8A4]" />
            </div>
          </div>
        </div>
      </div>

      {!isNeutral && (
        <div className="absolute top-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2.5 text-sm text-[#6B6560] shadow-sm">
          Keep a neutral expression
        </div>
      )}

      <div className="absolute bottom-28 left-4 right-4 space-y-2">
        <div className={`flex items-center gap-2.5 text-sm ${faceSize > 0 && faceSize < 300 ? "text-[#8A9A7B]" : "text-[#9C958D]"}`}>
          <span className="text-base">{faceSize > 0 && faceSize < 300 ? "✓" : "○"}</span>
          <span>Face detected</span>
        </div>
        <div className={`flex items-center gap-2.5 text-sm ${isAligned ? "text-[#8A9A7B]" : "text-[#9C958D]"}`}>
          <span className="text-base">{isAligned ? "✓" : "○"}</span>
          <span>Centered & level</span>
        </div>
        <div className={`flex items-center gap-2.5 text-sm ${distanceColor}`}>
          <span className="text-base">{distanceText === "Good distance" ? "✓" : "○"}</span>
          <span>{distanceText}</span>
        </div>
        <div className={`flex items-center gap-2.5 text-sm ${isGazing ? "text-[#8A9A7B]" : "text-[#9C958D]"}`}>
          <span className="text-base">{isGazing ? "✓" : "○"}</span>
          <span>Looking at camera</span>
        </div>
        <div className={`flex items-center gap-2.5 text-sm ${isNeutral ? "text-[#8A9A7B]" : "text-[#9C958D]"}`}>
          <span className="text-base">{isNeutral ? "✓" : "○"}</span>
          <span>Neutral expression</span>
        </div>
      </div>
    </div>
  );
}
