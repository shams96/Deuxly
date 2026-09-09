export type FaceMeshResult = {
  landmarks: { x: number; y: number; z: number }[];
  confidence: number;
};

export async function detectFace(): Promise<FaceMeshResult | null> {
  // Placeholder: integrate MediaPipe FaceMesh or TFJS face-landmarks-detection
  // Must run client-side only
  return null;
}

export function estimateFaceDistance(landmarks: { x: number; y: number }[]): number {
  // Approximate distance based on inter-pupillary distance relative to frame width
  if (landmarks.length < 468) return 0;
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  const faceWidthPx = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y);
  return faceWidthPx;
}

export function estimateHeadPose() {
  // Return approximate pitch/yaw/roll for guidance
  return { pitch: 0, yaw: 0, roll: 0 };
}
