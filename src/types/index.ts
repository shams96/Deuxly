export type SubscriptionTier = "free" | "premium";

export type PhotoLabel = "Baseline" | "Week 4" | "Week 8" | "Custom";

export type AnalysisZone =
  | "under-eye"
  | "forehead"
  | "cheeks"
  | "jawline"
  | "tone-texture";

export type AnalysisResult = {
  zones: Array<{
    name: AnalysisZone;
    change: "improved" | "worsened" | "neutral";
    confidence: number;
    note: string;
  }>;
  summary: string;
  disclaimer: string;
};
