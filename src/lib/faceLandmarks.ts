/**
 * Client-only face landmark detection via MediaPipe FaceMesh (tfjs runtime).
 *
 * TensorFlow.js and the face-mesh model are loaded from a CDN at runtime rather
 * than bundled: the packages ship browser UMD bundles that fight app bundlers,
 * and the model weights are fetched over the network regardless. Nothing here
 * may run on the server.
 */

export type Point = { x: number; y: number };

export type FaceLandmarks = {
  /** 468 mesh keypoints in source-image pixel coordinates. */
  keypoints: Point[];
  /** Tight face bounding box in source-image pixels. */
  box: { xMin: number; yMin: number; xMax: number; yMax: number; width: number; height: number };
  /** Detector confidence for this face, 0..1 (1 when the model omits a score). */
  score: number;
};

// MediaPipe FaceMesh canonical keypoint indices (subset we rely on).
export const IDX = {
  leftEyeOuter: 33,
  leftEyeInner: 133,
  rightEyeInner: 362,
  rightEyeOuter: 263,
  noseTip: 1,
  noseBottom: 2,
  chin: 152,
  foreheadTop: 10,
  browCenter: 9,
} as const;

const TFJS = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js";
const FACE_DETECTION =
  "https://cdn.jsdelivr.net/npm/@tensorflow-models/face-detection@1.0.3/dist/face-detection.min.js";
const FACE_LANDMARKS =
  "https://cdn.jsdelivr.net/npm/@tensorflow-models/face-landmarks-detection@1.0.6/dist/face-landmarks-detection.min.js";

type RawFace = {
  keypoints: Array<{ x: number; y: number; z?: number; name?: string }>;
  box?: FaceLandmarks["box"];
};

type Detector = {
  estimateFaces(
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageData,
    config?: { flipHorizontal?: boolean; staticImageMode?: boolean },
  ): Promise<RawFace[]>;
};

type FldGlobal = {
  SupportedModels: { MediaPipeFaceMesh: string };
  createDetector: (
    model: string,
    config: {
      runtime: "tfjs";
      refineLandmarks?: boolean;
      maxFaces?: number;
    },
  ) => Promise<Detector>;
};

const scriptCache = new Map<string, Promise<void>>();

function loadScript(src: string): Promise<void> {
  let p = scriptCache.get(src);
  if (!p) {
    p = new Promise<void>((resolve, reject) => {
      const el = document.createElement("script");
      el.src = src;
      el.async = true;
      el.crossOrigin = "anonymous";
      el.onload = () => resolve();
      el.onerror = () => {
        scriptCache.delete(src);
        reject(new Error(`failed to load ${src}`));
      };
      document.head.appendChild(el);
    });
    scriptCache.set(src, p);
  }
  return p;
}

let detectorPromise: Promise<Detector> | null = null;

/**
 * Lazily load tfjs + the face-mesh model and create a single detector.
 * Cached; the scripts and model download once.
 */
export async function getFaceDetector(): Promise<Detector> {
  if (typeof window === "undefined") {
    throw new Error("getFaceDetector is client-only");
  }
  if (!detectorPromise) {
    detectorPromise = (async () => {
      await loadScript(TFJS);
      await loadScript(FACE_DETECTION);
      await loadScript(FACE_LANDMARKS);
      const tf = (window as unknown as { tf?: { ready: () => Promise<void> } }).tf;
      if (tf) await tf.ready();
      const fld = (window as unknown as { faceLandmarksDetection?: FldGlobal })
        .faceLandmarksDetection;
      if (!fld) throw new Error("face-landmarks-detection failed to load");
      return fld.createDetector(fld.SupportedModels.MediaPipeFaceMesh, {
        runtime: "tfjs",
        refineLandmarks: false,
        maxFaces: 1,
      });
    })().catch((err) => {
      detectorPromise = null;
      throw err;
    });
  }
  return detectorPromise;
}

function toBox(kp: Point[], raw?: FaceLandmarks["box"]): FaceLandmarks["box"] {
  if (raw) return raw;
  let xMin = Infinity;
  let yMin = Infinity;
  let xMax = -Infinity;
  let yMax = -Infinity;
  for (const p of kp) {
    if (p.x < xMin) xMin = p.x;
    if (p.y < yMin) yMin = p.y;
    if (p.x > xMax) xMax = p.x;
    if (p.y > yMax) yMax = p.y;
  }
  return { xMin, yMin, xMax, yMax, width: xMax - xMin, height: yMax - yMin };
}

/**
 * Detect a single face. Returns null when no face is found or the model
 * failed to load.
 */
export async function detectLandmarks(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
): Promise<FaceLandmarks | null> {
  let detector: Detector;
  try {
    detector = await getFaceDetector();
  } catch {
    return null;
  }
  const faces = await detector.estimateFaces(input, { staticImageMode: true });
  const face = faces[0];
  if (!face || !face.keypoints?.length) return null;
  const keypoints: Point[] = face.keypoints.map((k) => ({ x: k.x, y: k.y }));
  return { keypoints, box: toBox(keypoints, face.box), score: 1 };
}

/** Midpoint of two mesh keypoints. */
export function mid(kp: Point[], a: number, b: number): Point {
  return { x: (kp[a].x + kp[b].x) / 2, y: (kp[a].y + kp[b].y) / 2 };
}

/** Eye centres and inter-ocular distance — the anchor frame for everything else. */
export function faceFrame(kp: Point[]) {
  const eyeL = mid(kp, IDX.leftEyeOuter, IDX.leftEyeInner);
  const eyeR = mid(kp, IDX.rightEyeInner, IDX.rightEyeOuter);
  const origin = { x: (eyeL.x + eyeR.x) / 2, y: (eyeL.y + eyeR.y) / 2 };
  const dx = eyeR.x - eyeL.x;
  const dy = eyeR.y - eyeL.y;
  const interocular = Math.hypot(dx, dy) || 1;
  const ax = { x: dx / interocular, y: dy / interocular };
  const ay = { x: -ax.y, y: ax.x };
  const nose = kp[IDX.noseTip];
  const noseProj = (nose.x - origin.x) * ay.x + (nose.y - origin.y) * ay.y;
  if (noseProj < 0) {
    ay.x = -ay.x;
    ay.y = -ay.y;
  }
  return { origin, ax, ay, interocular, eyeL, eyeR };
}
