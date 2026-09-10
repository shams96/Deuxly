"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type Mode = "slider" | "side-by-side";

type Props = {
  photoAUrl: string;
  photoBUrl: string;
  photoALabel?: string;
  photoBLabel?: string;
};

export default function ComparisonSlider({
  photoAUrl,
  photoBUrl,
  photoALabel = "Before",
  photoBLabel = "After",
}: Props) {
  const [mode, setMode] = useState<Mode>("slider");
  const [sliderPos, setSliderPos] = useState(50);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateWidth = () => setContainerWidth(el.getBoundingClientRect().width);
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mode]);

  const updateSlider = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = (x / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, pct)));
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    updateSlider(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons > 0) {
      updateSlider(e.clientX);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("slider")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              mode === "slider"
                ? "bg-ink text-bg"
                : "bg-bg text-on-fill hover:bg-accent-soft"
            }`}
          >
            Slider
          </button>
          <button
            type="button"
            onClick={() => setMode("side-by-side")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              mode === "side-by-side"
                ? "bg-ink text-bg"
                : "bg-bg text-on-fill hover:bg-accent-soft"
            }`}
          >
            Side by side
          </button>
        </div>
        <p className="text-xs text-ink-2">
          {mode === "slider" ? "Drag the divider to compare" : "Compare both views"}
        </p>
      </div>

      {mode === "slider" ? (
        <div
          ref={containerRef}
          className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-bg shadow-sm select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
        >
          <img src={photoBUrl} alt={photoBLabel} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
          <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%`, maxWidth: "100%" }}>
            <img
              src={photoAUrl}
              alt={photoALabel}
              className="h-full w-full object-cover"
              style={{ width: containerWidth ?? "100%" }}
              draggable={false}
            />
          </div>
          <div
            className="absolute top-0 bottom-0 w-1 cursor-ew-resize bg-accent touch-none"
            style={{ left: `${sliderPos}%`, transform: "translateX(-50%)" }}
          >
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-bg p-2 shadow">
              <svg width="16" height="16" viewBox="0 0 16 16" className="text-ink">
                <path d="M5 3l-3 5 3 5M11 3l3 5-3 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="absolute bottom-3 left-3 rounded-full bg-bg/90 px-3 py-1 text-xs font-medium text-ink">
            {photoALabel}
          </div>
          <div className="absolute bottom-3 right-3 rounded-full bg-bg/90 px-3 py-1 text-xs font-medium text-ink">
            {photoBLabel}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl bg-bg shadow-sm relative">
            <img src={photoAUrl} alt={photoALabel} className="h-full w-full object-cover" draggable={false} />
            <div className="absolute bottom-3 left-3 rounded-full bg-bg/90 px-3 py-1 text-xs font-medium text-ink">
              {photoALabel}
            </div>
          </div>
          <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl bg-bg shadow-sm relative">
            <img src={photoBUrl} alt={photoBLabel} className="h-full w-full object-cover" draggable={false} />
            <div className="absolute bottom-3 right-3 rounded-full bg-bg/90 px-3 py-1 text-xs font-medium text-ink">
              {photoBLabel}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
