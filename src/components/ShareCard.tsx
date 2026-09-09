"use client";

import { useRef } from "react";

type Props = {
  photoAUrl: string;
  photoBUrl: string;
  photoALabel?: string;
  photoBLabel?: string;
};

export default function ShareCard({ photoAUrl, photoBLabel, photoBUrl, photoALabel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateCard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1350;

    ctx.fillStyle = "#F9F7F4";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const imgA = new window.Image();
    const imgB = new window.Image();
    imgA.crossOrigin = "anonymous";
    imgB.crossOrigin = "anonymous";

    await Promise.all([
      new Promise<void>((resolve) => { imgA.onload = () => resolve(); imgA.src = photoAUrl; }),
      new Promise<void>((resolve) => { imgB.onload = () => resolve(); imgB.src = photoBUrl; }),
    ]);

    const padding = 60;
    const cardWidth = canvas.width - padding * 2;
    const cardHeight = (cardWidth * 3) / 4;
    const gap = 30;

    ctx.drawImage(imgA, padding, 120, (cardWidth - gap) / 2, cardHeight);
    ctx.drawImage(imgB, padding + (cardWidth + gap) / 2, 120, (cardWidth - gap) / 2, cardHeight);

    ctx.fillStyle = "#1C1C1C";
    ctx.font = "bold 36px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Deuxly", canvas.width / 2, 110);

    ctx.fillStyle = "#6B6560";
    ctx.font = "20px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("Skin progress comparison", canvas.width / 2, canvas.height - 40);

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "deuxly-progress.png";
    link.href = url;
    link.click();
  };

  const share = async () => {
    await generateCard();
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Deuxly Progress",
          text: `My skincare progress: ${photoALabel} vs ${photoBLabel}`,
        });
      } catch {
        // user cancelled
      }
    }
  };

  return (
    <div className="space-y-3">
      <canvas ref={canvasRef} className="hidden" />
      <button
        onClick={share}
        className="w-full py-3 rounded-xl bg-[#C6B8A4] text-white font-medium hover:bg-[#B8A892] transition-colors"
      >
        Share Progress Card
      </button>
    </div>
  );
}
