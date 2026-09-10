# Deploying Deuxly to Vercel

The repo is Vercel-ready (`vercel.json` sets `buildCommand` to
`prisma migrate deploy && next build`; `postinstall` runs `prisma generate`).
What Vercel needs from you: a Postgres database and environment variables.

## 1. Provision Postgres

Use any Postgres that Vercel's build + serverless functions can reach:

- **Neon** (recommended — serverless, generous free tier): create a project, copy
  the pooled connection string.
- **Vercel Postgres** (Storage tab in the project) — it sets `DATABASE_URL`
  automatically.
- **Supabase** — use the connection string from Project Settings → Database.

The driver adapter (`@prisma/adapter-pg`) needs a **direct** connection string
(`postgresql://…`), not a `prisma://` Accelerate URL.

## 2. Import the repo

At <https://vercel.com/new>, import `shams96/Deuxly`. Framework preset: Next.js
(auto-detected). Leave build/install commands as-is — `vercel.json` wins.

## 3. Environment variables

Set these in Project → Settings → Environment Variables (Production + Preview):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Postgres connection string from step 1 |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` — **do not** reuse the dev placeholder |
| `NEXTAUTH_URL` | `https://<your-deployment>.vercel.app` |
| `APP_URL` | same as `NEXTAUTH_URL` |
| `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` | from Stripe (test keys are fine to start) |
| `STRIPE_WEBHOOK_SECRET` | from the Stripe webhook you create pointing at `/api/stripe/webhook` |
| `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_YEARLY` | Stripe Price IDs |
| `NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY` | same as `STRIPE_PRICE_ID_MONTHLY` (read client-side on the settings page) |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` / `R2_PUBLIC_URL` | Cloudflare R2 — **required in production**; without it the app falls back to writing photos under `public/uploads`, which does not persist on Vercel and is not private (Phase 3 replaces this path) |

OAuth (`GOOGLE_*`, `APPLE_*`) are optional and only registered when both the id
and secret are set; credentials (email + password) auth works without them.

### "There is a problem with the server configuration"

That page comes from NextAuth. It means `authOptions` failed to initialise —
almost always **`NEXTAUTH_SECRET` is missing** in the environment. Set it (and
`NEXTAUTH_URL`) for Production *and* Preview, then redeploy. Setting a
`GOOGLE_*` / `APPLE_*` id without its matching secret triggers the same error.

## 4. First deploy

Vercel runs `npm install` → `prisma generate` → `prisma migrate deploy`
(applies `prisma/migrations/`) → `next build`. If the build fails on
`migrate deploy`, the database is unreachable from Vercel or `DATABASE_URL` is
wrong.

## 5. Post-deploy

- Point a Stripe webhook at `https://<deployment>/api/stripe/webhook` and copy its
  signing secret into `STRIPE_WEBHOOK_SECRET`, then redeploy.
- The analysis pipeline pulls TF.js + FaceMesh from `cdn.jsdelivr.net` and model
  weights from `storage.googleapis.com` at runtime. These work by default now; the
  Phase 3 CSP must allow them (`script-src`/`connect-src`).

## CLI alternative

```bash
vercel login
vercel link
vercel env add DATABASE_URL   # repeat per variable
vercel --prod
```
