# MediBridge Global

A world-class healthcare travel platform — the first Healthcare Travel Operating System helping UK patients discover, compare, and book verified treatments abroad, with full travel, insurance, and recovery coordination.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/medibridge run dev` — run the frontend (port 21089)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Framer Motion, shadcn/ui, wouter, TanStack Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — Drizzle table definitions: treatments, destinations, clinics, treatment_slots, testimonials, contacts
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/medibridge/src/` — React frontend

## Architecture decisions

- OpenAPI-first contract: all types generated via Orval from `lib/api-spec/openapi.yaml`
- Smart Package Optimizer is stateless (returns computed package bundles, no DB dependency)
- Cost comparison and admin metrics are static mock data in route handlers (no DB)
- Dashboard summary is static/seeded data (ready to wire auth when added)
- Affiliate link tracking is frontend-side via `data-affiliate` attributes

## Product

- **Homepage**: Hero search, Smart Package Optimizer, Treatment Slot Marketplace, Destinations, Featured Clinics, How It Works, Cost Comparison, Why MediBridge, Competitive comparison, Testimonials, FAQ, Contact form
- **Treatments** (`/treatments`): Browse and compare all procedures with UK vs Turkey savings
- **Clinics** (`/clinics`): JCI-accredited clinic marketplace with ratings, slots, pricing
- **Destinations** (`/destinations`): Istanbul, Antalya, Ankara, Shanghai, Shenzhen
- **Packages** (`/packages`): Smart Package Optimizer (step-by-step builder + cheapest/best value/premium options)
- **Dashboard** (`/dashboard`): Patient portal — upcoming treatments, travel, recovery
- **Admin** (`/admin`): Revenue metrics, bookings, affiliate tracking, inventory

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `pnpm run typecheck:libs` must be run before leaf artifact typechecks after any `lib/*` changes
- Do not rename `info.title` in `openapi.yaml` — Orval uses it to derive generated filenames
- Body schemas in OpenAPI must use entity-shaped names (e.g. `PackageRequest`, not `OptimizePackageBody`) to avoid TS2308 collisions

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
