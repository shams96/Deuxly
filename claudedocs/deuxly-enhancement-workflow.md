# Deuxly Enhancement Workflow

Generated 2026-09-08. Strategy: systematic. DB target: **Postgres** (PrismaPg adapter).

## Conventions

- **Branch per phase** off `main`: `feat/phase-1-foundation`, `feat/phase-2-analysis`, `feat/phase-3-security`, `feat/phase-4-design`. Merge via PR after its validation gate passes.
- **Validation gate** (every task, before marking done): `npx next build` clean + `tsc --noEmit` clean + phase tests green + `npx next lint` no new errors.
- **Task IDs** are `P<phase>.<n>`. `→` = hard dependency (must finish first).
- Keep the `next dev` agent block in `AGENTS.md` committed with the work (per repo instruction).

---

## Phase 0 — DONE

- Automation recommendations delivered (context7 + Playwright connected; skills/hooks/subagents proposed, not created).
- Breaking-change check: Prisma 7 no-`url` datasource is correct; `.env` not auto-loaded by Prisma CLI; two `page.tsx` → `/` is a confirmed Next 16 conflict.

---

## Phase 1 — Foundation: make it work

Branch: `feat/phase-1-foundation`. No behavior/feature additions — correctness only.

**Status (2026-09-08): COMPLETE — pending review/merge.**
- P1.1 ✅ `(dashboard)` route group → real `src/app/dashboard/` segment. Routes now `/dashboard`, `/dashboard/{capture,history,compare,analyses,settings}`; landing stays at `/`. Dual-`/` conflict gone (verified in build route table).
- P1.2 ✅ all in-app `/dashboard/*` links now resolve; e2e asserts no 404 + auth-gate to `/login`.
- P1.3 ✅ `GET /api/photos` → `{ photos }`; history + compare updated.
- P1.4 ✅ `POST /api/compare` → `{ id, createdAt, analysis }` (analysis = AnalysisResult); `GET /api/compare` → `{ analyses }`. Hardcoded scoreA/scoreB block deleted, now calls `generateAnalysis()`. `analyses/page.tsx` retyped. `analysis.ts`: confidence now 0..1 float; free tier returns `zones: []` (was invalid `name:"overall"`).
- P1.5 ✅ `src/app/api/upload/route.ts` deleted (no-op).
- P1.6 ✅ Postgres 16 via `docker-compose.yml` (host port 55432). `src/lib/prisma.ts` → `PrismaPg`. `schema.prisma` provider `postgresql`. `prisma/config.ts` → root `prisma.config.ts` (auto-discovered) with `dotenv` load. `better-sqlite3` + adapter removed. `prisma/migrations/…_init` committed. `DATABASE_URL` updated in `.env` + `.env.local` (gitignored).
- P1.7 ✅ Vitest (6 unit tests: analysis shape, rate-limit window) + Playwright (9 e2e smoke) + `.github/workflows/ci.yml` (spins Postgres service, migrate deploy, typecheck, eslint, unit, e2e). Scripts: `test`, `test:e2e`, `typecheck`, `db:*`.
- **Deferred to Phase 2:** authenticated e2e (signup → login → capture → compare round-trip) — needs real capture flow; unauth smoke covers routing now.
- Gate: `next build` ✅ · `tsc --noEmit` ✅ · `eslint` ✅ (5 pre-existing warnings, 0 errors) · `vitest` ✅ · `playwright` ✅.

### P1.1 Route structure decision + fix  → (none)

**Decision to lock first:** add a real `dashboard` segment (URLs become `/dashboard/*`, matches all existing links, landing stays at `/`). This is lower-churn than rewriting every link.

- Move `src/app/(dashboard)/` page files under `src/app/(dashboard)/dashboard/` so they resolve to `/dashboard`, `/dashboard/capture`, `/dashboard/history`, `/dashboard/compare`, `/dashboard/analyses`, `/dashboard/settings`.
- Keep `src/app/(dashboard)/layout.tsx` at the group root (still wraps all children) OR move alongside — verify layout still applies.
- `src/app/page.tsx` stays the public landing at `/`. Resolves the dual-`/` conflict.
- Files touched: `src/app/(dashboard)/**` (moves), `src/app/(dashboard)/dashboard/layout.tsx` (nav wrapper).
- Gate: build shows `/dashboard`, `/dashboard/capture`, … in route table; no duplicate-page error.

### P1.2 Fix in-app navigation targets  → P1.1

- `src/app/(dashboard)/nav.tsx` — `navItems` already point to `/dashboard/*`; confirm `isActive` prefix logic still correct with real segment.
- `src/app/(dashboard)/dashboard/page.tsx`, `history/page.tsx`, `compare/page.tsx` — `Link href` already `/dashboard/*`; confirm they now resolve.
- `src/components/ProtectedRoute.tsx:53` — `router.push("/dashboard/settings?tab=subscription")` now valid.
- `src/app/(dashboard)/capture/page.tsx` + `dashboard/layout.tsx` — `redirect("/login")` unchanged.
- Manual check: click every nav item in `next dev`, no 404.

### P1.3 API contract fix — photos list shape  → (none, parallel with P1.1)

- `src/app/(dashboard)/compare/page.tsx:59` reads `data.photos`; `GET /api/photos` returns a bare array. Pick one shape and make both sides agree — recommend `GET /api/photos` returns `{ photos: [...] }` (also fixes `history/page.tsx:26` which currently guards with `data.photos ?? data ?? []`).
- Update: `src/app/api/photos/route.ts` GET response, `compare/page.tsx`, `history/page.tsx`.

### P1.4 API contract fix — compare result shape  → (none, parallel)

- `POST /api/compare` returns `{ ...analysis, result }`; `compare/page.tsx:47` reads `data.analysis`.
- Standardize on `{ analysis: { id, createdAt, result } }`. Update `src/app/api/compare/route.ts` POST return + `compare/page.tsx` + `analyses/page.tsx` (GET side reads `data` array directly — keep or wrap consistently).

### P1.5 Delete dead upload route  → (none, parallel)

- Remove `src/app/api/upload/route.ts` (no-op, returns `placeholder://`). Grep for `/api/upload` references first — expect none.

### P1.6 DB → Postgres  → (none, parallel with P1.1–P1.5; merge-order after)

- `prisma/schema.prisma`: set `datasource db { provider = "postgresql" }`. Keep no `url` (v7).
- `prisma/config.ts`: `DATABASE_URL` must be a Postgres connection string; add `dotenv` load (`import 'dotenv/config'` or explicit) since Prisma 7 CLI does not auto-load `.env`.
- `src/lib/prisma.ts`: replace `PrismaBetterSqlite3` with `PrismaPg({ connectionString: process.env.DATABASE_URL })`. Keep the global-singleton guard.
- `package.json`: drop `@prisma/adapter-better-sqlite3`, `better-sqlite3`; keep `@prisma/adapter-pg`, `pg`.
- Delete `prisma/dev.db` and `prisma/prisma/dev.db`; add `prisma/*.db` to `.gitignore` (belt-and-suspenders).
- `prisma/schema.prisma`: add explicit `generator client { provider = "prisma-client-js"; output = "..." }` if v7 requires; verify against `npx prisma generate`.
- `npx prisma migrate dev --name init` → creates `prisma/migrations/`. Commit it.
- README already says Postgres — no doc change needed; verify the env-var table matches.
- Gate: `npx prisma migrate deploy` on a clean Postgres DB succeeds; app boots; signup + capture + list round-trips.

### P1.7 Test harness + smoke tests  → P1.1–P1.6

- Add Vitest (unit) + Playwright (e2e; MCP already available). Config in `vitest.config.ts`, `playwright.config.ts`, tests in `tests/`.
- Unit: `src/lib/analysis.ts` shape, `src/lib/rateLimit.ts` window logic, storage key sanitization.
- E2e smoke: signup → login → land on `/dashboard` → open `/dashboard/capture` → nav to each tab (no 404). Camera mocked via `--use-fake-device-for-media-stream` or route stub.
- Add `.github/workflows/ci.yml`: install → `prisma generate` → `next build` → `tsc --noEmit` → `vitest run` → `playwright test`.
- Gate: CI green on the phase-1 PR.

**Phase 1 exit:** all nav works, compare page actually loads photos and renders a (still-fake) analysis, Postgres migrations in repo, CI running.

---

## Phase 2 — Real analysis

Branch: `feat/phase-2-analysis`. Depends on Phase 1 merged.

**Status (2026-09-08): COMPLETE — pending review/merge.**
- P2.1 ✅ `src/lib/faceLandmarks.ts` — MediaPipe FaceMesh (tfjs runtime) loaded from **CDN at runtime** (jsdelivr), not bundled. `@tensorflow/tfjs`, `@tensorflow-models/face-landmarks-detection`, `@mediapipe/face_mesh` removed from deps — their UMD bundles broke Turbopack (`@mediapipe/face_mesh` has no ESM exports) and the model weights download over the network anyway. `detectLandmarks()` + `faceFrame()` anchor frame (eye-midpoint origin, inter-ocular unit, +y toward chin). Old `faceDetection.ts` placeholder deleted.
- P2.2 ✅ `CameraCapture.tsx` — replaced the Chrome-only `window.FaceDetector` path with the FaceMesh detector on the live video (throttled ~180ms, in-flight guard, disables after repeated failures → manual capture fallback). Distance from box ratio, centring from box x-bounds.
- P2.3 ✅ `src/lib/align.ts` — Umeyama similarity transform (`estimateSimilarity`) from eye/nose/chin anchors, residual, per-channel `channelStats` + `matchExposure` to neutralise lighting/white-balance drift.
- P2.4 ✅ `src/lib/zones.ts` (face-anchored zone rectangles → image polygons, point-in-polygon) + `src/lib/metrics.ts` (`zoneMetric`: mean luma, gradient-magnitude texture, redness; `compareZone`: lower texture/redness = improved, big residual brightness delta → neutral + low confidence).
- P2.5 ✅ `src/lib/compareImages.ts` client orchestrator (rasterise→detect→register→exposure-match→sample→compare), runs in the browser. `src/lib/analysis.ts` — `Math.random()` gone; `buildAnalysisResult()` from real comparisons + `validateAnalysisResult()` (server-side shape/range guard). `POST /api/compare` now accepts `{ photoAId, photoBId, result }`, validates, persists. `compare/page.tsx` runs the pipeline client-side, POSTs the result, handles `analyzing` / `no-face` / `error` states. `VisualOverlay.tsx` draws real landmark polygons over the baseline photo.
- P2.6 ✅ `AnalysisSummary.tsx` — per-zone **diverging bar** (improved right / worsened left, length = confidence, glyph + word so it is not colour-alone) via `dataviz` skill guidance; brand sage/rose diverging pair + warm-gray midpoint.
- P2.7 ✅ 33 unit tests (align maths recover a known transform; metrics on synthetic buffers; deterministic full-pipeline in `pipeline.test.ts` — identical photos → all-neutral & stable, smoother B → improved). Authenticated e2e `compare.spec.ts` (signup → login → upload ×2 → compare reaches a terminal state, no page errors).
- **Fixed in passing:** no `SessionProvider` wrapped the dashboard tree — `useSession()` in `dashboard/page.tsx`, `settings/page.tsx`, `compare/page.tsx` had no provider. Added `src/app/providers.tsx` (SessionProvider + ToastProvider) in the root layout; removed the ad-hoc one in `page.tsx`.
- **Deferred to Phase 3:** local `public/uploads` fallback still used when R2 is unset (now gitignored) — Phase 3 P3.3 replaces it with private owner-scoped storage. CDN `script-src`/`connect-src` (jsdelivr + `storage.googleapis.com` model weights) must be in the CSP — Phase 3 P3.5.
- Gate: `next build` ✅ · `tsc --noEmit` ✅ · `eslint` ✅ (5 pre-existing warnings) · `vitest` 33/33 ✅ · `playwright` 10/10 ✅.

### P2.1 Face landmark module  → (none)

- Rewrite `src/lib/faceDetection.ts` to load `@tensorflow-models/face-landmarks-detection` (MediaPipe FaceMesh runtime, already in deps) client-side. Lazy-import; guard SSR.
- Export `detectLandmarks(source: HTMLVideoElement | HTMLImageElement | ImageBitmap): Promise<{ keypoints, box, score } | null>`.
- Unit-test against 2–3 fixture face images in `tests/fixtures/`.

### P2.2 Wire detection into capture  → P2.1

- `src/components/CameraCapture.tsx`: replace the `window.FaceDetector` path (Chrome-only) with P2.1. Keep the existing distance/centred/quality-condition UX; feed it landmark-derived metrics (inter-ocular distance / frame width for distance, box centroid for centring).
- Keep a graceful "detection unavailable" fallback (manual capture) for load failure.
- Remove `faceDetectorSupported` browser-API branch.

### P2.3 Alignment + normalization  → P2.1

- New `src/lib/align.ts`: given landmarks for photo A and B, compute similarity transform (eye centers + nose) to register B onto A. Normalize exposure (histogram match on the face-box crop).
- Output aligned `ImageData` pairs for zone sampling.

### P2.4 Zone metrics  → P2.3

- New `src/lib/metrics.ts`: for each zone (under-eye, forehead, cheeks, jawline, tone-texture) defined as landmark-polygon masks, compute: mean brightness, local texture variance (Laplacian or local std), redness (a* proxy from RGB). Return per-zone `{ deltaBrightness, deltaTexture, deltaRedness }` A→B.
- Map deltas → `change: improved|worsened|neutral` + `confidence` (function of landmark score, alignment residual, sample size). Document the thresholds.

### P2.5 Replace fake analysis  → P2.4

- `src/lib/analysis.ts`: delete `Math.random()` generators; `generateAnalysis` now consumes P2.4 output. Keep the non-medical `disclaimer` string. Keep free/premium gating (free = overall only, premium = 5 zones).
- `src/app/api/compare/route.ts`: remove hardcoded `scoreA/scoreB` block. Decide compute location:
  - **Client-compute** (recommended): browser runs P2.1–P2.4 on the two stored images, POSTs the numeric result; server validates ranges, persists `resultJson`. Keeps heavy CV off the server, no native deps.
  - Server-compute alternative documented but deferred (needs canvas/WASM on server).
- `src/components/VisualOverlay.tsx`: position zone rects from real landmark polygons instead of the static `ZONE_POSITIONS` percentages.

### P2.6 Result charts  → P2.5

- Use the `dataviz` skill for the design pass. Per-zone delta bar / slope chart in `AnalysisSummary.tsx`; keep it inside the existing card system.
- Free tier: single "overall" bar. Premium: 5-zone.

### P2.7 Tests  → P2.5

- Unit: metrics on synthetic gradients (known brightness/texture delta) assert correct sign + magnitude bucket.
- Unit: alignment residual on a translated/rotated fixture.
- E2e: capture two photos (fake media stream, fixed images) → compare → assert deterministic non-random zone output.
- Gate: analysis output for identical A==B images is `neutral` on all zones with high confidence.

**Phase 2 exit:** compare produces reproducible, explainable results from actual pixels; `@mediapipe`/`@tensorflow` deps are used; no `Math.random` in the analysis path.

---

## Phase 3 — Security & privacy

Branch: `feat/phase-3-security`. Can start after Phase 1 (parallel with Phase 2 if staffed; otherwise after).

**Status (2026-09-10): COMPLETE — pending review/merge. Commit `8ed3dc2`.**
- P3.1 ✅ `rateLimit.ts` → Postgres fixed-window (`INSERT … ON CONFLICT` with a window-reset `CASE`), fails open. Applied to `POST /api/photos`, `/api/compare`, `/api/stripe/checkout`, `/api/auth/signup` (per-IP via `clientIp`), `/api/auth/delete-account`. New `RateLimit` model + index.
- P3.2 ✅ `imageValidation.ts` — magic-byte sniff (JPEG/PNG/WebP, rejects declared MIME), 12 MB cap (Content-Length + `file.size` + buffer), 64–8000px bounds, full `sharp` re-encode to JPEG (strips EXIF/GPS and any trailing payload). Label/notes length caps.
- P3.3 ✅ `storage.ts` rewritten — R2 or `.data/uploads` **outside `public/`**; server-generated `photos/<userId>/<uuid>-<kind>.<ext>` keys (no user filename → no traversal). New `GET /api/photos/[id]/file` streams bytes after session + ownership check; DB stores opaque keys, API responses expose only same-origin authed URLs (`withPhotoUrls`, `storageUrl` dropped from every `select`). `DELETE` removes storage objects too. `next/image` R2 `remotePatterns` removed (all same-origin now).
- P3.4 ✅ `sw.js` v2 — never intercepts `/api/*` (no private photo/response caching), same-origin static only, `clear-cache` message handler; `lib/signOut.ts` wraps NextAuth `signOut` to purge all caches on sign-out (wired into nav, settings, Header).
- P3.5 ✅ `next.config.ts` `headers()` — CSP (`script-src`/`connect-src` allow `cdn.jsdelivr.net` + `storage.googleapis.com` for the tfjs CDN runtime; `'unsafe-eval'`/`'unsafe-inline'` still required by tfjs + Next bootstrap — **flagged to tighten** once CV is bundled/SRI-pinned), `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` (`camera=self`), HSTS.
- P3.6 ✅ Stripe webhook — `WebhookEvent` table claims `event.id` first (duplicates acked without reprocessing); `invoice.payment_failed` → downgrade.
- P3.7 ✅ Two-step account deletion — `POST` issues a 15-min `AccountDeletionToken`; `DELETE` requires the token **plus the account email typed back**; wipes all photo storage objects before the cascade. Settings page updated (`window.prompt` for email).
- P3.8 ✅ Security review of the branch diff — **no HIGH/MEDIUM findings**; PR is a net security gain. Noted (out of scope): CSP `unsafe-*`, XFF-spoofable rate-limit bucket, webhook `catch`-all swallows transient errors.
- Migration `20260910130000_phase3_security` applied to local Postgres; `prisma migrate status` clean, no drift. Schema: `photos.content_type`, `RateLimit`, `WebhookEvent`, `AccountDeletionToken`.
- Gate: `next build` ✅ · `tsc --noEmit` ✅ · `eslint` ✅ (5 pre-existing warnings) · `vitest` 40/40 ✅ · `playwright` 12/12 ✅ (incl. cross-user 404, anon 401, non-image 415).

### P3.1 Durable rate limiting  → (none)

- Replace in-memory `Map` in `src/lib/rateLimit.ts`. Options: Postgres table (`rate_limit_hits`, we already have PG) or Upstash Redis. Recommend a small PG-backed fixed-window to avoid new infra.
- Apply to: `POST /api/photos`, `POST /api/compare`, `POST /api/auth/signup`, `POST /api/stripe/checkout`.
- Unit-test window rollover + per-user isolation.

### P3.2 Upload validation  → (none)

- `src/app/api/photos/route.ts` POST: enforce `Content-Length` cap (e.g. 12 MB) before `arrayBuffer()`; validate magic bytes (JPEG/PNG/WebP) not just `file.type`; cap dimensions via `sharp.metadata()` and reject absurd sizes; strip EXIF on re-encode (sharp `.rotate()` then drop metadata).
- Reject on failure with 400/413; add tests with a non-image payload and an oversized payload.

### P3.3 Private storage  → P3.2

- `src/lib/storage.ts`: remove the `public/uploads` fallback path entirely — face photos must never land in a world-readable dir. If R2 not configured in dev, use a gitignored `.data/uploads` served only through an authenticated route.
- Add `GET /api/photos/[id]/file` that checks session + ownership and streams from R2 via a short-TTL signed URL (or proxies). `storageUrl` in DB becomes an opaque key, never a public URL.
- Update `next.config.ts` `images.remotePatterns` accordingly; update `PhotoTimeline`/`PhotoModal`/`ComparisonSlider` to use the authed URL.
- E2e: second user cannot fetch first user's photo id (expect 403/404).

### P3.4 Service worker scoping  → (none)

- `public/sw.js`: drop `/api/` from `networkFirst` caching (or cache only explicitly safe GETs); never cache authed photo/analysis responses. Add cache-busting on logout (message channel → `caches.delete`).
- Verify: after logout, `caches` holds no user data.

### P3.5 Security headers + CSP  → (none)

- `next.config.ts` `headers()`: `Content-Security-Policy` (scope `script-src`/`connect-src` to self + Stripe + R2 + TF CDN if used), `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`, `Permissions-Policy` (camera=self).
- Test with `next build` + a header assertion in e2e.

### P3.6 Stripe webhook hardening  → (none)

- `src/app/api/stripe/webhook/route.ts`: add idempotency — persist processed `event.id` (PG table), no-op on replay. Handle `invoice.payment_failed` → downgrade path. Confirm `constructEvent` raw-body handling under Next 16 route handlers.
- Test with a duplicated event fixture.

### P3.7 Delete-account confirmation  → (none)

- `src/app/api/auth/delete-account/route.ts`: require a POSTed confirmation token (re-auth or typed email) — currently a bare authed POST hard-deletes the user + cascade. Add a 2-step (request → confirm) or password re-entry.
- Also delete storage objects for the user's photos, not just DB rows.

### P3.8 Security review  → P3.1–P3.7

- Run the `security-reviewer` subagent + `/security-review` on the branch diff. Triage findings.
- Gate: no High/Critical open.

**Phase 3 exit:** rate limiting survives restarts, uploads validated, photos private + owner-scoped, SW leaks nothing, headers/CSP set, webhook idempotent, account deletion is deliberate.

---

## Phase 4 — Design system & UX

Branch: `feat/phase-4-design`. After Phase 1 (independent of 2/3 but merge last to avoid churn).

### P4.1 Tokenize palette  → (none)

- Move the brand hexes (`#F9F7F4`, `#C6B8A4`, `#8A9A7B`, `#B87A7A`, `#C4A484`, `#1C1C1C`, `#6B6560`, `#E8E2DA`, …) into Tailwind v4 `@theme` in `src/app/globals.css` as semantic tokens (`--color-bg`, `--color-surface`, `--color-accent`, `--color-success`, `--color-error`, `--color-warn`, `--color-text`, `--color-muted`, `--color-border`).
- Codemod `bg-[#hex]` / `text-[#hex]` / `border-[#hex]` → token classes across `src/**`. Use `refactoring`/pattern edit; verify visually per screen.
- README "Brand Colors" section: update guidance from arbitrary values to tokens.

### P4.2 Dark mode  → P4.1

- Add dark token set under `@media (prefers-color-scheme: dark)` + a `data-theme` override. `layout.tsx` already sets `bg-[#F9F7F4]` on body — switch to token.
- Check contrast (WCAG AA) both themes.

### P4.3 Accessibility pass  → P4.1

- Icon-only "Flip" button + mobile menu button in `nav.tsx` / `CameraCapture.tsx`: add `aria-label`.
- `nav.tsx` renders text where icons were intended — either add real icons or keep text but ensure `aria-current` on active.
- Form labels in `CameraCapture` review card + `login`/`signup`: associate `<label htmlFor>`.
- Focus-visible rings on all interactive elements; trap focus in `PhotoModal`.
- Run axe via Playwright; gate on no serious violations.

### P4.4 Real landing page  → P4.1

- `src/app/page.tsx` is currently just the camera. Build a real landing: hero (the "second look" positioning), how-it-works (3 steps), privacy stance, pricing table (reuse Phase 5 outcome if done), CTA to `/signup`. Camera preview can stay as a section.
- Keep it a client-light server component where possible.

### P4.5 Motion / gesture polish (apple-design)  → P4.1

- Invoke the `apple-design` skill. Apply to: capture countdown + phase transitions (`setup→capture→review`), `ComparisonSlider` drag (velocity-aware, interruptible), `PhotoModal` open/close (spring sheet), toast enter/exit.
- Use `framer-motion` (already in deps, v13). Respect `prefers-reduced-motion`.

### P4.6 PWA polish  → (none)

- Resolve duplicate manifest: `public/manifest.json` vs `src/app/manifest.ts` — keep the `manifest.ts` (typed) and delete the static one, or vice versa; update `layout.tsx` `metadata.manifest`.
- Verify icons (`public/icons/…`), `theme_color`, `display: standalone`, offline fallback page. Lighthouse PWA pass.

### P4.7 Tests  → P4.3, P4.5

- Playwright: theme toggle persists, axe clean on landing + dashboard + capture, reduced-motion respected, slider drag works via mouse + touch.

**Phase 4 exit:** no raw hex in components, dark mode, axe-clean, real landing, motion feels intentional, single manifest, Lighthouse PWA green.

---

## Phase 5 — Positioning (optional)

Not a code branch. Run `sc:business-panel` on: the free/premium split (4 captures, 30-day retention, limited overlays vs unlimited/forever/full) and the "not medical / visual estimate only" boundary — is it a liability shield, a positioning weakness, or both? Output feeds P4.4 pricing section and any copy in `settings`/paywall.

---

## Dependency graph (critical path)

```
P1.1 ─┬─ P1.2 ─────────────┐
      │                    │
P1.3 ─┤                    ├─ P1.7 ── (Phase 1 PR) ─┬─ Phase 2: P2.1─P2.2/P2.3─P2.4─P2.5─P2.6─P2.7
P1.4 ─┤                    │                        ├─ Phase 3: P3.1─P3.7 ─ P3.8
P1.5 ─┤                    │                        └─ Phase 4: P4.1─P4.2/P4.3/P4.4/P4.5/P4.6 ─ P4.7
P1.6 ─┘                    │
                     (merge order: P1.6 last within phase 1)
```

Phases 2, 3, 4 are mutually independent after Phase 1 — parallelizable if staffed, else run 2 → 3 → 4. Phase 5 any time; do before P4.4.

## Per-phase validation gate (all must pass)

1. `npx prisma generate && npx next build` — clean
2. `npx tsc --noEmit` — clean
3. `npx vitest run` — green
4. `npx playwright test` — green
5. `npx next lint` — no new errors
6. Phase-specific exit criteria (above) met
7. For Phase 3: `security-reviewer` + `/security-review` — no High/Critical
