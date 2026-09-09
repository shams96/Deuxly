# Deuxly

**The second look at your skin — properly framed.**

Deuxly is a premium, privacy-first Progressive Web App for standardized facial photo tracking. Capture, compare, and understand your skincare progress over time with a calm, luxurious experience.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4 with custom luxury color system
- **Auth:** NextAuth.js v4 (Credentials + Google + Apple)
- **Database:** PostgreSQL via Prisma 7 (with driver adapters)
- **Storage:** Cloudflare R2 / Supabase Storage (private buckets)
- **Payments:** Stripe Checkout + Customer Portal + Webhooks
- **Vision:** MediaPipe Face Mesh / TensorFlow.js (client-side only)
- **PWA:** Custom service worker + web app manifest

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Cloudflare R2 or Supabase Storage bucket
- Stripe account (test mode recommended)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Configure your environment variables (see .env.example)

# Start a local Postgres 16 (host port 55432; matches the default DATABASE_URL)
npm run db:up

# Apply migrations + generate the client
npm run db:migrate

# Run development server
npm run dev
```

To stop the database: `npm run db:down`. To inspect it: `npm run db:studio`.

### Environment Variables

See `.env.example` for all required variables. Key ones:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | NextAuth session secret |
| `NEXTAUTH_URL` | App URL (e.g. http://localhost:3000) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `R2_ACCOUNT_ID` | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_URL` | R2 public URL (optional) |

### Database Schema

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Or run migrations
npx prisma migrate dev
```

## Brand Colors

Deuxly uses a strict warm luxury palette:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-background` | `#F9F7F4` | Page background |
| `--color-surface` | `#FFFFFF` | Cards, modals |
| `--color-text-primary` | `#1C1C1C` | Primary text |
| `--color-accent` | `#C6B8A4` | Champagne gold accent |
| `--color-success` | `#8A9A7B` | Positive changes |
| `--color-warning` | `#C4A484` | Terracotta warning |
| `--color-error` | `#B87A7A` | Muted rose error |

Use Tailwind arbitrary values: `bg-[#F9F7F4]`, `text-[#C6B8A4]`, etc.

## Project Structure

```
src/
  app/
    (auth)/           # Public auth pages (login, signup)
    (dashboard)/      # Protected app pages
      capture/        # Camera capture flow
      history/        # Photo timeline
      compare/        # Before/after comparison
      settings/       # Account & subscription
    api/              # API routes
  components/         # Shared React components
  lib/                # Utilities, auth, db, stripe
  types/              # TypeScript types
prisma/
  schema.prisma       # Database schema
public/
  sw.js               # Service worker
  manifest.json       # PWA manifest
```

## Key Features

### MVP Scope

- Landing page with luxury Deuxly brand identity
- Email + password and social authentication (Google/Apple)
- Real-time camera capture with face guidance
- Secure photo history with timeline view
- Side-by-side and slider comparison
- Visual difference overlays and analysis summaries
- Stripe subscription (test mode)
- Mobile-first PWA

### Vision Limitations

All computer vision features are approximate and for personal tracking only:

- Distance is estimated from face size in frame (not millimeter-accurate)
- Head alignment and gaze detection are approximate
- Analysis results are visual estimates, never medical or diagnostic

## Monetization

| Feature | Free | Premium |
|---------|------|---------|
| Captures/month | 4 | Unlimited |
| History retention | 30 days | Forever |
| Visual overlays | Limited | Full |
| Detailed summary | No | Yes |
| High-res export | No | Yes |

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Roadmap

- Phase 2 (out of scope for MVP): Advanced AI scoring, community feed, admin dashboard, native mobile apps

## License

Proprietary - Deuxly
