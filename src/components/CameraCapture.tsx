"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useToast } from "@/components/Toast";

type QualityCondition = {
  label: string;
  met: boolean;
  instruction: string;
};

type Props = {
  onCapture?: (dataUrl: string, blob: Blob) => void;
};

type DistanceState = "unknown" | "too_close" | "good" | "too_far";

export default function CameraCapture({ onCapture }: Props) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [label, setLabel] = useState("Baseline");
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useState<QualityCondition[]>([
    { label: "Face detected", met: false, instruction: "Make sure your face is visible in the frame" },
    { label: "Face centered", met: false, instruction: "Position your face in the center of the oval" },
    { label: "Good distance", met: false, instruction: "Hold your phone about 2 feet away from your face" },
    { label: "Neutral expression", met: false, instruction: "Keep a neutral expression for consistency" },
  ]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPremium] = useState(false);
  const [phase, setPhase] = useState<"setup" | "capture" | "review">("setup");
  const [lightingOk, setLightingOk] = useState(false);
  const [distanceState, setDistanceState] = useState<DistanceState>("unknown");
  const [countdown, setCountdown] = useState<number | null>(null);
  // True while we expect the FaceMesh model to be usable; flips to false if it
  // fails to load, which drops the UI back to manual guided capture.
  const [faceDetectorSupported, setFaceDetectorSupported] = useState(true);
  const [detectorActive, setDetectorActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startedRef = useRef(false);
  const countdownRef = useRef<number | null>(null);
  const toast = useToast();
  const allConditionsMet = quality.every((c) => c.met);

  useEffect(() => {
    if (phase !== "capture") return;
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    const run = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (!cancelled) {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError("Camera access denied. Please enable camera permissions.");
        }
      }
    };

    run();

    return () => {
      cancelled = true;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [phase, facing]);

  function getDistanceLabel(state: DistanceState): string {
    switch (state) {
      case "too_close":
        return "Move back";
      case "too_far":
        return "Move closer";
      case "good":
        return "Perfect distance";
      default:
        return "~2 feet ideal";
    }
  }

  function getDistanceColor(state: DistanceState): string {
    switch (state) {
      case "too_close":
        return "var(--color-danger)";
      case "too_far":
        return "var(--color-warning)";
      case "good":
        return "var(--color-success)";
      default:
        return "var(--color-accent)";
    }
  }

  function getDistanceInstruction(state: DistanceState): string {
    switch (state) {
      case "too_close":
        return "You're too close. Move back about 2 feet from your face";
      case "too_far":
        return "You're too far. Move closer to about 2 feet from your face";
      case "good":
        return "Perfect distance for consistent photos";
      default:
        return "Hold your phone about 2 feet away from your face";
    }
  }

  useEffect(() => {
    if (!stream || !videoRef.current) return;
    const video = videoRef.current;
    let animationId: number;
    let cancelled = false;
    let inFlight = false;
    let lastRun = 0;
    let failures = 0;
    let detector: Awaited<ReturnType<typeof import("@/lib/faceLandmarks").getFaceDetector>> | null = null;

    const initDetector = async () => {
      try {
        const { getFaceDetector } = await import("@/lib/faceLandmarks");
        detector = await getFaceDetector();
        if (!cancelled) setDetectorActive(true);
      } catch {
        if (!cancelled) {
          detector = null;
          setDetectorActive(false);
          setFaceDetectorSupported(false);
        }
      }
    };

    const initializing = () =>
      setQuality([
        { label: "Face detected", met: false, instruction: "Starting face detection…" },
        { label: "Face centered", met: false, instruction: "Starting face detection…" },
        { label: "Good distance", met: false, instruction: "Starting face detection…" },
        { label: "Neutral expression", met: true, instruction: "Keep a neutral expression for consistency" },
      ]);

    const noFace = () =>
      setQuality([
        { label: "Face detected", met: false, instruction: "Make sure your face is visible in the frame" },
        { label: "Face centered", met: false, instruction: "Position your face in the center of the oval" },
        { label: "Good distance", met: false, instruction: "Hold your phone about 2 feet away from your face" },
        { label: "Neutral expression", met: true, instruction: "Keep a neutral expression for consistency" },
      ]);

    const loop = async () => {
      if (cancelled) return;
      animationId = requestAnimationFrame(loop);

      if (video.readyState < 2) return;
      const now = Date.now();
      if (inFlight || now - lastRun < 180) return;

      if (!detector) {
        if (faceDetectorSupported) initializing();
        return;
      }

      inFlight = true;
      lastRun = now;
      try {
        const faces = await detector.estimateFaces(video, { staticImageMode: false });
        const face = faces[0];
        if (face?.box) {
          failures = 0;
          const faceSize = Math.max(
            face.box.height / video.videoHeight,
            face.box.width / video.videoWidth,
          );
          let distance: DistanceState = "unknown";
          if (faceSize > 0.55) distance = "too_close";
          else if (faceSize > 0.22) distance = "good";
          else if (faceSize > 0) distance = "too_far";
          setDistanceState(distance);

          const centered =
            face.box.xMin > video.videoWidth * 0.1 &&
            face.box.xMax < video.videoWidth * 0.9;

          setQuality([
            { label: "Face detected", met: true, instruction: "Great! Your face is visible" },
            { label: "Face centered", met: centered, instruction: "Center your face in the oval" },
            { label: "Good distance", met: distance === "good", instruction: getDistanceInstruction(distance) },
            { label: "Neutral expression", met: true, instruction: "Good expression! Ready to capture" },
          ]);
        } else {
          setDistanceState("unknown");
          noFace();
        }
      } catch {
        failures += 1;
        if (failures > 5) {
          detector = null;
          setDetectorActive(false);
          setFaceDetectorSupported(false);
        }
        setDistanceState("unknown");
      } finally {
        inFlight = false;
      }
    };

    initDetector();
    animationId = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      cancelAnimationFrame(animationId);
    };
  }, [stream, faceDetectorSupported]);

  useEffect(() => {
    if (phase !== "capture") return;

    if (detectorActive && allConditionsMet && countdown === null) {
      Promise.resolve().then(() => {
        setCountdown(3);
        countdownRef.current = window.setInterval(() => {
          setCountdown((prev) => {
            if (prev === null) {
              if (countdownRef.current) clearInterval(countdownRef.current);
              countdownRef.current = null;
              return null;
            }
            if (prev <= 1) {
              if (countdownRef.current) clearInterval(countdownRef.current);
              countdownRef.current = null;
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      });
    }

    if (!allConditionsMet && countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [phase, detectorActive, allConditionsMet, countdown]);

  const handleStartCapture = () => {
    startedRef.current = false;
    setCountdown(null);
    setPhase("capture");
  };

  const handleCapture = useCallback(async () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(null);

    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCapture?.(dataUrl, blob);
          setPreview(dataUrl);
          setPhase("review");
        }
      },
      "image/jpeg",
      0.9
    );
  }, [onCapture]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      Promise.resolve().then(() => handleCapture());
    }
  }, [countdown, handleCapture]);

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    setSaveError(null);

    try {
      const blob = dataURLtoBlob(preview);
      const form = new FormData();
      form.append("image", blob, `${label.replace(/\s+/g, "_")}.jpg`);
      form.append("label", label);
      if (notes.trim()) form.append("notes", notes.trim());

      const res = await fetch("/api/photos", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save photo");
      }

      setPreview(null);
      setNotes("");
      setLabel("Baseline");
      setPhase("setup");
      setLightingOk(false);
      setDistanceState("unknown");
      toast.addToast("Photo saved successfully", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save photo";
      setSaveError(message);
      toast.addToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const retake = () => {
    setPreview(null);
    setSaveError(null);
    setCountdown(null);
    setPhase("capture");
  };

  if (phase === "review" && preview) {
    return (
      <div className="space-y-4">
        <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl bg-bg shadow-sm relative">
          <Image src={preview} alt="Preview" fill className="object-cover" />
        </div>

        <div className="p-4 rounded-xl bg-success/10 border border-success/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-success-ink text-lg">✓</span>
            <span className="text-sm font-medium text-ink">Photo captured!</span>
          </div>
          <p className="text-xs text-ink-2">Review your photo above. If it looks good, add details and save. Otherwise, retake it.</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Label</label>
            <select
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-line bg-surface text-sm text-ink"
            >
              <option>Baseline</option>
              <option>Week 4</option>
              <option>Week 8</option>
              <option>Custom</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-line bg-surface text-sm text-ink resize-none"
              placeholder="Optional notes about this photo..."
            />
          </div>
          {saveError && (
            <div className="p-3 rounded-lg bg-danger/10 text-danger-ink text-sm">{saveError}</div>
          )}
          <div className="flex gap-3">
            <button
              onClick={retake}
              disabled={saving}
              className="flex-1 py-3 rounded-xl border border-line text-ink font-medium hover:bg-surface-2 transition-colors disabled:opacity-50"
            >
              Retake
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-accent text-on-fill font-medium hover:bg-accent-strong transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Photo"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "setup") {
    return (
      <div className="space-y-4">
        <div className="p-5 rounded-2xl bg-surface border border-line">
          <h3 className="text-base font-semibold text-ink mb-3">Prepare for your photo</h3>
          <ol className="space-y-3 text-sm text-ink-2">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-accent-soft text-accent-ink text-xs flex items-center justify-center font-medium shrink-0">1</span>
              <span>Find a <strong>well-lit area</strong>. Natural light from a window works best. Avoid harsh shadows on your face.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-accent-soft text-accent-ink text-xs flex items-center justify-center font-medium shrink-0">2</span>
              <span>Hold your phone about <strong>2 feet</strong> from your face. You should be able to see your whole face comfortably in the frame.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-accent-soft text-accent-ink text-xs flex items-center justify-center font-medium shrink-0">3</span>
              <span>Use a <strong>neutral expression</strong> — relax your face and look directly at the camera. No big smiles or frowns.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-accent-soft text-accent-ink text-xs flex items-center justify-center font-medium shrink-0">4</span>
              <span>Remove <strong>glasses, hats, or anything</strong> covering your face for the clearest result.</span>
            </li>
          </ol>
        </div>

        {!faceDetectorSupported && (
          <div className="p-3 rounded-xl bg-surface-2 border border-line">
            <p className="text-xs text-ink-2">
              Automatic face detection couldn&apos;t start on this device. The app will use guided positioning instead — line your face up with the oval.
            </p>
          </div>
        )}

        <div className="p-4 rounded-xl bg-surface-2 border border-line">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={lightingOk}
              onChange={(e) => setLightingOk(e.target.checked)}
              className="w-5 h-5 rounded border-accent text-accent-ink focus:ring-accent"
            />
            <span className="text-sm text-ink">My face is well-lit and I can see the camera clearly</span>
          </label>
        </div>

        <button
          onClick={handleStartCapture}
          disabled={!lightingOk}
          className="w-full py-4 rounded-2xl bg-accent text-on-fill font-medium hover:bg-accent-strong transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Camera
        </button>

        {!lightingOk && (
          <p className="text-xs text-center text-ink-3">Please confirm your lighting before continuing</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 rounded-xl bg-danger/10 text-danger-ink text-sm">{error}</div>
      )}

      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-ink shadow-sm">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          disablePictureInPicture
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ padding: "env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)" }}>
          <div className="relative w-[65%] aspect-[3/4]">
            <div className="absolute inset-0 border-2 border-accent rounded-full opacity-80" />
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="text-xs text-accent-ink bg-ink/80 px-3 py-1.5 rounded-full backdrop-blur-sm font-medium">
                Position face here
              </span>
            </div>

            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="text-[10px] text-accent-ink/80 bg-ink/60 px-2 py-1 rounded-full backdrop-blur-sm">
                ~2 feet away
              </span>
            </div>
          </div>
        </div>

        {faceDetectorSupported && distanceState !== "unknown" && distanceState !== "good" && (
          <div className="absolute top-4 left-4 right-4">
            <div className="p-2 rounded-lg text-center" style={{ backgroundColor: getDistanceColor(distanceState), color: 'white' }}>
              <p className="text-xs font-medium">{getDistanceLabel(distanceState)}</p>
            </div>
          </div>
        )}

        {faceDetectorSupported && distanceState === "good" && (
          <div className="absolute top-4 left-4 right-4">
            <div className="p-2 rounded-lg bg-success/90 backdrop-blur-sm text-center">
              <p className="text-xs text-white font-medium">Ready! Photo will be taken automatically...</p>
            </div>
          </div>
        )}

        {countdown !== null && countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-black/40 rounded-full blur-xl" />
              <div className="relative text-7xl font-light text-white drop-shadow-lg w-32 h-32 flex items-center justify-center">
                {countdown}
              </div>
            </div>
          </div>
        )}

        {detectorActive && !allConditionsMet && distanceState !== "good" && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="p-3 rounded-xl bg-ink/90 backdrop-blur-sm border border-accent/30">
              <p className="text-xs text-accent-ink font-medium mb-1">Adjusting:</p>
              <p className="text-xs text-white/90">
                {quality.find((c) => !c.met)?.instruction || "Follow the guide above to position your face correctly"}
              </p>
            </div>
          </div>
        )}
      </div>

      {detectorActive && distanceState !== "unknown" && (
        <div className="p-3 rounded-xl bg-surface border border-line">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-ink">Distance</span>
            <span className="text-xs font-medium" style={{ color: getDistanceColor(distanceState) }}>
              {getDistanceLabel(distanceState)}
            </span>
          </div>
          <div className="w-full h-2 bg-surface-2 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: distanceState === "good" ? "100%" : distanceState === "too_close" ? "80%" : "30%", backgroundColor: getDistanceColor(distanceState) }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-ink-3">Too close</span>
            <span className="text-[10px] text-ink-3">~2 feet</span>
            <span className="text-[10px] text-ink-3">Too far</span>
          </div>
        </div>
      )}

      {!detectorActive && (
        <div className="p-3 rounded-xl bg-surface-2 border border-line">
          <p className="text-xs text-ink-2 text-center">
            Automatic face detection is unavailable. Position your face in the oval and tap Capture below.
          </p>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      <div className="grid grid-cols-2 gap-2">
        {quality.map((c) => (
          <div
            key={c.label}
            className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
              c.met ? "bg-success/10 text-success-ink" : "bg-surface-2 text-on-fill-2"
            }`}
          >
            <span>{c.met ? "✓" : "○"}</span>
            <span>{c.label}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <select
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="px-4 py-2 rounded-xl border border-line bg-surface text-sm text-ink"
        >
          <option>Baseline</option>
          <option>Week 4</option>
          <option>Week 8</option>
          <option>Custom</option>
        </select>

        <button
          onClick={() => setFacing(facing === "user" ? "environment" : "user")}
          className="p-2 rounded-full bg-surface border border-line text-ink hover:bg-surface-2 transition-colors"
        >
          Flip
        </button>
      </div>

      <button
        onClick={handleCapture}
        disabled={detectorActive ? (!allConditionsMet && countdown === null) : false}
        className={`w-full py-4 rounded-2xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          countdown !== null
            ? "bg-danger text-on-fill hover:bg-danger-strong"
            : detectorActive
              ? (allConditionsMet ? "bg-success text-on-fill hover:bg-success-strong" : "bg-accent text-on-fill hover:bg-accent-strong")
              : "bg-accent text-on-fill hover:bg-accent-strong"
        }`}
      >
        {countdown !== null ? `Cancel (${countdown})` : detectorActive ? (allConditionsMet ? "Capturing..." : "Complete all checks to capture") : "Capture Photo"}
      </button>

      {!isPremium && (
        <p className="text-xs text-center text-ink-3">
          Free tier: 4 captures/month. Upgrade for unlimited captures.
        </p>
      )}
    </div>
  );
}

function dataURLtoBlob(dataurl: string) {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}
