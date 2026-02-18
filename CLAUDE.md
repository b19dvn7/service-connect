# Service Connect — CLAUDE.md

This document provides a comprehensive reference for AI assistants working in this codebase.

---

## Project Overview

**Service Connect** is a truck/vehicle maintenance request management application. It allows customers to submit service requests (work orders) and gives shop admins a dashboard to track, manage, and invoice those requests.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Routing | Wouter |
| State / Data | TanStack Query v5 |
| UI Components | shadcn/ui (Radix UI primitives), Lucide icons |
| Styling | Tailwind CSS v3, CSS variables for theming |
| Animation | Framer Motion |
| Forms | React Hook Form + Zod resolvers |
| Backend | Express.js (TypeScript, ESM) |
| Database | PostgreSQL via Drizzle ORM |
| Auth | Replit OIDC / simple username+password / disabled |
| Build | Vite (client), esbuild (server) |
| Runtime | Node.js with `tsx` for dev, bundled CJS for prod |

---

## Directory Structure

```
service-connect/
├── client/                  # React frontend
│   ├── index.html
│   └── src/
│       ├── App.tsx           # Root component + router
│       ├── main.tsx          # React entrypoint
│       ├── index.css         # Global CSS + theme variables
│       ├── pages/
│       │   ├── Home.tsx
│       │   ├── SubmitRequest.tsx
│       │   ├── Dashboard.tsx
│       │   ├── Login.tsx
│       │   └── not-found.tsx
│       ├── components/
│       │   ├── ui/           # shadcn/ui components
│       │   ├── Navbar.tsx
│       │   ├── InvoiceDialog.tsx
│       │   ├── StatusBadge.tsx
│       │   ├── Clock.tsx
│       │   └── SpriteClock.tsx
│       ├── hooks/
│       │   ├── use-auth.ts
│       │   ├── use-requests.ts
│       │   ├── use-mobile.tsx
│       │   └── use-toast.ts
│       └── lib/
│           ├── auth-utils.ts
│           ├── queryClient.ts
│           └── utils.ts
├── server/                  # Express backend
│   ├── index.ts              # App bootstrap + HTTP server
│   ├── server-routes.ts      # PRIMARY route handler (used in production)
│   ├── routes.ts             # Legacy route file (not imported in prod)
│   ├── storage.ts            # IStorage interface + DB and memory implementations
│   ├── db.ts                 # Drizzle + pg Pool setup
│   ├── static.ts             # Production static file serving
│   ├── vite.ts               # Vite dev server integration
│   └── replit_integrations/
│       └── auth/
│           ├── index.ts      # Re-exports
│           ├── replitAuth.ts # Auth logic (OIDC, simple auth, disabled mode)
│           ├── routes.ts     # /api/auth/user endpoint
│           └── storage.ts    # Auth-specific DB operations (sessions, users)
├── shared/                  # Shared between client and server
│   ├── schema.ts             # Drizzle schema + Zod types (main tables)
│   ├── routes.ts             # Type-safe API route definitions
│   └── models/
│       └── auth.ts           # Auth DB tables (sessions, users for Replit auth)
├── script/
│   └── build.ts              # Production build orchestration
├── drizzle.config.ts         # Drizzle Kit config
├── vite.config.ts            # Vite config
├── tailwind.config.ts        # Tailwind config
├── tsconfig.json             # TypeScript config
└── package.json
```

---

## Development Commands

```bash
npm run dev        # Start dev server (Express + Vite HMR) on port 5000
npm run build      # Production build (Vite client + esbuild server)
npm run start      # Run production build (dist/index.cjs)
npm run check      # TypeScript type check (no emit)
npm run db:push    # Push schema to database (requires DATABASE_URL)
```

The dev server serves both the API and the Vite-proxied frontend from a single port (default **5000**).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Recommended | PostgreSQL connection string. If missing, app falls back to in-memory storage. |
| `SESSION_SECRET` | Recommended | Express session secret. Defaults to an insecure dev value. |
| `PORT` | No | HTTP server port. Defaults to `5000`. |
| `REPL_ID` | Replit only | Enables Replit OIDC authentication. |
| `ISSUER_URL` | Replit only | OIDC issuer URL. Defaults to `https://replit.com/oidc`. |
| `SIMPLE_AUTH_USER` | Optional | Username for simple local auth. |
| `SIMPLE_AUTH_PASS` | Optional | Password for simple local auth. |
| `AUTH_DISABLED` | Optional | Set to `"1"` or `"true"` to disable all auth (open access). |
| `VITE_USE_APP_LOGIN` | Optional | Set to `"true"` to use the `/login` React page instead of `/api/login`. |
| `SIMPLE_AUTH_MAX_AGE_HOURS` | Optional | Session duration in hours when simple auth is enabled. Defaults to `4`. |

---

## Authentication Modes

Auth behaviour is determined at startup by environment variable presence:

1. **Replit OIDC** — Active when `REPL_ID` is set (and `SIMPLE_AUTH_USER`/`PASS` are not). Uses OpenID Connect via Passport.js.
2. **Simple auth** — Active when both `SIMPLE_AUTH_USER` and `SIMPLE_AUTH_PASS` are set. Renders a minimal HTML login form at `GET /api/login`; accepts credentials via `POST /api/login`.
3. **Disabled** — Active when `AUTH_DISABLED=1` or when neither of the above are configured (e.g. local dev without Replit). All `isAuthenticated` checks pass through. `/api/auth/user` returns a local-admin placeholder.

The `isAuthenticated` middleware in `server/replit_integrations/auth/replitAuth.ts` handles all three modes.

---

## Database Schema

Defined in `shared/schema.ts` (Drizzle ORM + Zod):

### `maintenance_requests`
Core work order table.

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `customerName` | text | Required |
| `contactInfo` | text | Phone / email / company |
| `vehicleInfo` | text | Year/Make/Model |
| `vehicleColor` | text | Optional |
| `mileage` | integer | Optional |
| `description` | text | Plain text OR `SERVICE_JSON:...` payload |
| `status` | text | `pending` / `in_progress` / `completed` |
| `isUrgent` | boolean | |
| `workDone` | text | Admin-filled service summary |
| `partsUsed` | text | Admin-filled parts list |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

### `invoices`
Linked to a maintenance request.

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `requestId` | integer FK | References `maintenance_requests.id` |
| `invoiceNumber` | text | |
| `laborDescription` | text | |
| `laborHours` | text | |
| `laborRate` | text | |
| `laborTotal` | text | |
| `partsDetails` | text | |
| `partsTotal` | text | |
| `miscDescription` | text | |
| `miscTotal` | text | Default `"0"` |
| `subtotal` | text | |
| `tax` | text | Default `"0"` |
| `total` | text | |
| `notes` | text | |
| `paymentStatus` | text | `unpaid` / `paid` / `void` |
| `paymentMethod` | text | |

Auth tables (`sessions`, `users`) are in `shared/models/auth.ts` and are only used by the Replit OIDC flow.

---

## API Routes

Routes are type-safely defined in `shared/routes.ts` and registered in `server/server-routes.ts`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/auth/user` | required | Current user info |
| GET | `/api/login` | — | Initiate login |
| GET | `/api/logout` | — | Destroy session |
| GET | `/api/callback` | — | OIDC callback (Replit only) |
| GET | `/api/requests` | required | List all work orders |
| GET | `/api/requests/:id` | required | Get single work order |
| POST | `/api/requests` | public | Submit new work order |
| PATCH | `/api/requests/:id` | required | Update work order |
| DELETE | `/api/requests/:id` | required | Delete work order |
| GET | `/api/invoices` | required | List all invoices |
| GET | `/api/invoices/request/:requestId` | required | Get invoice for a request |
| POST | `/api/invoices` | required | Create invoice |
| PATCH | `/api/invoices/:id` | required | Update invoice |
| POST | `/api/uploads` | public | Upload file attachments |

`POST /api/requests` is intentionally public — customers submit requests without logging in.

---

## Storage Layer

`server/storage.ts` exports a single `storage` instance. If `DATABASE_URL` is set it is a `DatabaseStorage`, otherwise a `MemoryStorage`. Both implement the `IStorage` interface:

```typescript
interface IStorage {
  createRequest / getRequests / getRequest / updateRequest / deleteRequest
  createInvoice / getInvoices / getInvoiceByRequest / updateInvoice
}
```

Always interact with data through `storage`, never directly through `db`.

---

## `SERVICE_JSON:` Description Encoding

The `description` column on a maintenance request can hold either:
- **Plain text** — a freeform complaint written directly.
- **Structured payload** — a JSON string prefixed with the literal `SERVICE_JSON:`.

The structured format is produced by `SubmitRequest.tsx` when service checkboxes are used:

```
SERVICE_JSON:{"groups":{"Filters":{...},"Fluids":{...},...},"issueText":"...","attachments":[...]}
```

`Dashboard.tsx` calls `parseServicePayload()` to detect and decode this format. When updating inline notes or group completion from the dashboard, the payload is re-serialised via `serializeServicePayload()` and written back to the `description` field.

---

## Frontend Conventions

### Path Aliases (tsconfig + vite)

| Alias | Resolves to |
|---|---|
| `@/` | `client/src/` |
| `@shared/` | `shared/` |
| `@assets/` | `attached_assets/` |

### UI Components
shadcn/ui (New York style) is used. Components live in `client/src/components/ui/`. The `components.json` config drives the `shadcn` CLI if adding new components.

### Theming
All colours are CSS custom properties defined in `client/src/index.css` and consumed as Tailwind tokens via `tailwind.config.ts`. Dark mode is class-based (`darkMode: ["class"]`). Font families use `--font-display`, `--font-sans`, `--font-body`, etc.

### Data Fetching
TanStack Query is used for all server state. Query keys mirror API paths (e.g. `["/api/requests"]`). After mutations, call `queryClient.invalidateQueries` to trigger refetches. The `queryClient` instance is in `client/src/lib/queryClient.ts`.

### Routing
Wouter handles client-side routing. Routes are declared in `client/src/App.tsx`. The dashboard route checks `isAuthenticated` from `useAuth()` and redirects to login if false.

---

## Build System

Production build (`npm run build`) runs `script/build.ts`:
1. Wipes `dist/`.
2. Runs `vite build` → outputs to `dist/public/`.
3. Runs `esbuild` on `server/index.ts` → outputs to `dist/index.cjs` (CJS, minified, bundles allowed deps).

Server deps in the build allowlist are bundled (reduces syscalls on cold start); everything else is left as an external `require`.

---

## Known Gotchas

- **`server/routes.ts` vs `server/server-routes.ts`**: `server/routes.ts` is an older version and is not imported by `server/index.ts`. The authoritative route file is `server/server-routes.ts`. Do not confuse the two.
- **Seeding**: On startup, `server-routes.ts` inserts two example work orders if the database is empty. This only runs once.
- **Auth guard on submit**: `POST /api/requests` deliberately has no `isAuthenticated` guard — customers submit without an account.
- **Invoice amounts as text**: All monetary columns (`laborRate`, `total`, etc.) are stored as `text`, not numeric. Keep arithmetic client-side.
- **Session table**: The `sessions` table (for Replit/pg-backed sessions) is defined in `shared/models/auth.ts`, not in the main `shared/schema.ts`.
- **`routes.ts` also exports `buildUrl`**: Use `buildUrl(path, params)` from `@shared/routes` to interpolate `:id`-style path params instead of manual string replacement.
