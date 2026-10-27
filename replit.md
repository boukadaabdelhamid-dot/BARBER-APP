# BarberLink

BarberLink helps customers discover mobile barbers, request at-home appointments, and helps independent barbers publish their services.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/barberlink` — customer discovery, booking requests, and barber onboarding
- `artifacts/api-server` — shared API routes
- `lib/api-spec/openapi.yaml` — API contract source of truth
- `lib/db/src/schema/` — PostgreSQL schema

## Architecture decisions

- The first release is a booking-request MVP; it does not collect online payments.
- A booking request is persisted before the customer is offered a WhatsApp link to contact the barber and confirm details.
- New barber profiles enter a pending-review state and are not publicly listed until activated.

## Product

- Customers can search mobile barbers by city or service, view services and travel fees, and request a date and time.
- Barbers can submit a profile, coverage areas, contact number, and services for review.
- The planned launch model is free for barbers initially, followed by a percentage commission on bookings.

## User preferences

- Keep the product focused on mobile barbers and customers; online payment is not a launch prerequisite.

## Gotchas

- Barber submissions are pending by design; the initial MVP has no in-app moderation screen, so approve pilot profiles through the development database until an authenticated review flow is added.
- The booking request does not include a home address. Customers share exact location details directly with the barber after contacting them.
- Development contains three clearly labeled demonstration profiles with unusable phone numbers; replace them with real, consented providers before any public launch.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
