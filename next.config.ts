import type { NextConfig } from "next";

// Fail the build loudly on missing critical config, so a misconfigured deploy
// surfaces as a readable build error instead of NextAuth's opaque
// "There is a problem with the server configuration" page at runtime.
if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-development-server") {
  const missing = ["DATABASE_URL", "NEXTAUTH_SECRET"].filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        `Set them in your host's project settings (see DEPLOY.md) and redeploy.`,
    );
  }
  const url = process.env.NEXTAUTH_URL;
  if (url && !/^https?:\/\//.test(url)) {
    throw new Error(
      `NEXTAUTH_URL must include the protocol, e.g. https://your-app.vercel.app (got "${url}").`,
    );
  }
}

// TensorFlow.js and the FaceMesh model load from jsDelivr at runtime; model
// weights come from storage.googleapis.com. 'unsafe-eval' / 'wasm-unsafe-eval'
// are required by the tfjs runtime — tighten once the CV path is bundled or
// pinned to a SRI'd script. 'unsafe-inline' covers Next's inline bootstrap.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.r2.cloudflarestorage.com https://lh3.googleusercontent.com",
  "font-src 'self' data:",
  "connect-src 'self' blob: https://cdn.jsdelivr.net https://storage.googleapis.com https://*.r2.cloudflarestorage.com https://api.stripe.com",
  "worker-src 'self' blob:",
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "form-action 'self' https://checkout.stripe.com",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
