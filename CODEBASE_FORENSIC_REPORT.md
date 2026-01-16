# FORENSIC CODEBASE ANALYSIS REPORT

## Service-Connect Repository

**Analysis Date:** 2026-01-15
**Repository Path:** `/home/bigdan7/Projects/Service-Connect`
**Total Size:** ~410MB (387MB is node_modules)
**Source Code Size:** ~23MB
**Analyst:** Automated forensic analysis

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Complete Inventory](#step-1--complete-inventory)
3. [Functional Classification](#step-2--functional-classification)
4. [Evidence Scoring](#step-3--evidence-scoring)
5. [Retention Decisions](#step-4--retention-decisions)
6. [Proposed Structure](#step-5--proposed-structure)
7. [Final Report](#step-6--final-report)
8. [Appendices](#appendices)

---

## EXECUTIVE SUMMARY

### What This Application Does

**Service-Connect** is a **vehicle maintenance service request web application** designed for a diesel truck repair shop. It allows:

- **Customers** to submit service requests (oil changes, filters, gaskets, major components)
- **Admins** to view, manage, and update work orders via authenticated dashboard
- **Custom branding** via graffiti-style date/time display using custom fonts

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | Express.js, Node.js |
| Database | PostgreSQL with Drizzle ORM |
| Auth | Replit OAuth (Passport.js + OpenID Connect) |
| Build | ESBuild, TypeScript, Vite |
| Platform | Replit (deployment target) |

### Key Metrics

| Metric | Value |
|--------|-------|
| Total Files (excl node_modules) | ~480 |
| TypeScript/TSX Files | 69 |
| UI Components (shadcn) | 47 |
| Font Asset Files | 351 |
| Python Scripts | 7 |
| Core Source Lines | ~7,000 |
| Database Tables | 3 |

---

## STEP 1 — COMPLETE INVENTORY

### 1.1 Core Application Components

| Path | Type | Entry Point | Description | Inputs | Outputs | Runnable | Evidence |
|------|------|-------------|-------------|--------|---------|----------|----------|
| `server/index.ts` | TypeScript | **YES** | Express HTTP server setup, middleware, logging | ENV vars (PORT, NODE_ENV), HTTP requests | HTTP responses, console logs | YES | imports express, createServer, listens on port |
| `server/routes.ts` | TypeScript | NO | API route definitions for CRUD on maintenance requests | HTTP requests via Express | JSON responses, DB writes | YES (via index.ts) | exports registerRoutes, defines REST endpoints |
| `server/storage.ts` | TypeScript | NO | Data access layer (DB or in-memory fallback) | DB connection, request data | DB records | YES (via routes) | implements IStorage interface, uses drizzle-orm |
| `server/db.ts` | TypeScript | NO | PostgreSQL database connection initialization | DATABASE_URL env var | DB connection object | YES | imports pg, drizzle-orm |
| `server/static.ts` | TypeScript | NO | Static file serving for production builds | Express app | Static files served | YES | exports serveStatic |
| `server/vite.ts` | TypeScript | NO | Vite dev server integration | HTTP server, Express app | Hot module reload | YES (dev only) | exports setupVite |
| `server/replit_integrations/auth/index.ts` | TypeScript | NO | Auth module exports | - | Auth functions | YES | re-exports auth components |
| `server/replit_integrations/auth/routes.ts` | TypeScript | NO | Authentication routes | HTTP requests | Auth responses | YES | defines /api/login, /api/logout, /api/me |
| `server/replit_integrations/auth/replitAuth.ts` | TypeScript | NO | Replit OAuth implementation | OAuth tokens | User sessions | YES | uses passport, openid-client |
| `server/replit_integrations/auth/storage.ts` | TypeScript | NO | Auth state storage | Session data | Stored sessions | YES | session management |
| `client/src/main.tsx` | TypeScript/React | **YES** | React application entry point | DOM element | React app render | YES | createRoot, renders App |
| `client/src/App.tsx` | TypeScript/React | NO | Router and provider setup | React context | UI routes | YES | imports Switch, Route, QueryClientProvider |
| `client/src/pages/Home.tsx` | TypeScript/React | NO | Landing page with truck logos | None | UI render | YES | renders logo images, navigation |
| `client/src/pages/Dashboard.tsx` | TypeScript/React | NO | Admin dashboard for work orders | API data | CRUD UI for requests | YES | useQuery, useMutation for /api/requests |
| `client/src/pages/SubmitRequest.tsx` | TypeScript/React | NO | Service request submission form | User input | POST to /api/requests | YES | useForm, mutate call |
| `client/src/pages/not-found.tsx` | TypeScript/React | NO | 404 error page | None | UI render | YES | simple component |
| `client/src/components/Clock.tsx` | TypeScript/React | NO | Graffiti-style clock display (font-based) | System time | UI render | YES | uses CSS class graffClock |
| `client/src/components/SpriteClock.tsx` | TypeScript/React | NO | Sprite-based clock display | System time | UI render | YES | uses sprite sheets for digits |
| `client/src/components/Navbar.tsx` | TypeScript/React | NO | Navigation bar component | None | UI render | YES | standard component |
| `client/src/components/StatusBadge.tsx` | TypeScript/React | NO | Status indicator badge | Status prop | UI render | YES | displays status |
| `client/src/components/ui/*.tsx` | TypeScript/React | NO | shadcn/ui component library (47 files) | Props | UI render | YES | Radix UI primitives |
| `client/src/hooks/use-auth.ts` | TypeScript | NO | Authentication hook | None | Auth state | YES | fetches /api/me |
| `client/src/hooks/use-requests.ts` | TypeScript | NO | Service requests hook | None | Request mutations | YES | useCreateRequest |
| `client/src/hooks/use-toast.ts` | TypeScript | NO | Toast notification hook | None | Toast state | YES | notification system |
| `client/src/hooks/use-mobile.tsx` | TypeScript | NO | Mobile detection hook | None | Boolean | YES | responsive detection |
| `client/src/lib/queryClient.ts` | TypeScript | NO | TanStack Query configuration | None | Query client | YES | data fetching setup |
| `client/src/lib/auth-utils.ts` | TypeScript | NO | Auth utility functions | None | Helper functions | YES | auth helpers |
| `client/src/lib/utils.ts` | TypeScript | NO | General utilities | None | cn() function | YES | className merge |
| `shared/schema.ts` | TypeScript | NO | Drizzle ORM database schema definitions | None | Types, table definitions | YES | defines sessions, users, maintenanceRequests |
| `shared/routes.ts` | TypeScript | NO | Typed API route definitions with Zod schemas | None | Route type definitions | YES | exports api object |
| `shared/models/auth.ts` | TypeScript | NO | Auth type definitions | None | TypeScript types | YES | type exports |
| `script/build.ts` | TypeScript | **YES** | Production build script | Source files | dist/index.cjs | YES | esbuild bundling |

### 1.2 Font Generation Pipeline (font-work/)

| Path | Type | Entry Point | Description | Inputs | Outputs | Runnable | Evidence |
|------|------|-------------|-------------|--------|---------|----------|----------|
| `font-work/build_clock_font_autoalign.py` | Python | **YES** | Font generator using FontForge - SVG to TTF | glyph_svg/*.svg | JanGraffClock.ttf | YES (requires fontforge) | imports fontforge, generates .ttf |
| `font-work/build_clock_font_from_eps.py` | Python | YES | Font generator from EPS files | glyph_eps/*.eps | TTF output | UNKNOWN | similar structure |
| `font-work/build_clock_font_from_png.py` | Python | YES | Font generator from PNG files | glyph_png/*.png | TTF output | UNKNOWN | variant approach |
| `font-work/build_clock_font_from_clean_eps.py` | Python | YES | Font generator from cleaned EPS | glyph_eps_clean/*.eps | TTF output | UNKNOWN | variant approach |
| `font-work/normalize_glyphs.py` | Python | YES | Glyph normalization script v1 | PNG files | Normalized PNGs | UNKNOWN | image processing |
| `font-work/normalize_glyphs_v2.py` | Python | YES | Glyph normalization script v2 | PNG files | Normalized PNGs | UNKNOWN | improved version |
| `font-work/graffiti_numbers_cleaned_pack/make_graffiti_numbers_clean.py` | Python | YES | Graffiti number image processor | Source images | Cleaned images | UNKNOWN | nested utility |

### 1.3 Font Asset Directories

| Directory | Files | Size | Description |
|-----------|-------|------|-------------|
| `font-work/glyph_svg/` | 13 | 4KB | **PRIMARY** - Vector sources (0-9, colon, dash, extra) |
| `font-work/glyph_png/` | 13 | 56KB | Raster versions of glyphs |
| `font-work/glyph_png_bold/` | 13 | 56KB | Bold variant |
| `font-work/glyph_png_clean/` | 13 | 56KB | Cleaned variant |
| `font-work/glyph_png_norm/` | 13 | 68KB | Normalized variant |
| `font-work/glyph_eps/` | 26 | 160KB | EPS vectors + PBM intermediates |
| `font-work/glyph_eps_clean/` | 13 | 2.2MB | Cleaned EPS vectors |
| `font-work/digits_cells/` | 12 | 500KB | Raw digit cells |
| `font-work/digits_cells_clean/` | 12 | 52KB | Cleaned digit cells |
| `font-work/numbers_singles/` | 12 | 176KB | Single number images |
| `font-work/months/` | 1 | 44KB | Month source sheet |
| `font-work/months_cells_clean/` | 12 | 52KB | Cleaned month cells |
| `font-work/months_singles/` | 12 | 100KB | Single month images |
| `font-work/months_outline_sets/` | 7+2 dirs | 548KB | Outline variants (black/white) |
| `font-work/graffiti_months_cleaned_pack/` | 35 | 2.2MB | Curated month pack (with qc.json) |
| `font-work/graffiti_numbers_cleaned_pack/` | 10+4 dirs | 13MB | Curated number pack (with subdirs) |
| `font-work/out_cells/` | 15 | 64KB | Processing output |
| `font-work/out_png/` | 14 | 56KB | Processing output |

### 1.4 Font Output Files

| File | Size | Description |
|------|------|-------------|
| `font-work/JanGraffClock.ttf` | 8KB | Generated TrueType font |
| `font-work/JanGraffClock.woff2` | 4KB | Web-optimized font |
| `font-work/sheet.png` | 180KB | Sprite sheet for SpriteClock |

**Total font-work:** 351 files, 19MB

### 1.5 Research & Documentation

| Path | Type | Size | Description |
|------|------|------|-------------|
| `research/AuditReport.md` | Markdown | 2KB | Web typography audit for graffiti font approach |
| `research/InventorBrief.md` | Markdown | 3KB | Decision brief for custom font vs SVG |
| `research/ClaimMatrix.csv` | CSV | 1KB | Evidence matrix for font claims |

### 1.6 Build Artifacts & Configuration

| Path | Type | Description |
|------|------|-------------|
| `dist/index.cjs` | JavaScript | Compiled production bundle (1.1MB) |
| `dist/public/assets/*` | Various | Compiled frontend assets |
| `package.json` | JSON | NPM config (81 deps, 23 devDeps) |
| `package-lock.json` | JSON | Locked versions (312KB) |
| `tsconfig.json` | JSON | TypeScript compiler config |
| `vite.config.ts` | TypeScript | Vite bundler config |
| `tailwind.config.ts` | TypeScript | Tailwind CSS config |
| `drizzle.config.ts` | TypeScript | Drizzle ORM migration config |
| `components.json` | JSON | shadcn/ui config |
| `postcss.config.js` | JavaScript | PostCSS config |
| `.replit` | Config | Replit platform config |
| `replit.md` | Markdown | Replit documentation |

### 1.7 Client Assets

| Path | Files | Description |
|------|-------|-------------|
| `client/src/assets/logos/` | 8 PNG | Vehicle brand logos (Volvo, Cummins, Detroit Diesel) |
| `client/public/fonts/` | Multiple | Font files, sprites |
| `client/public/favicon.png` | 1 | Site favicon |
| `client/src/styles/graff.css` | 1 | Custom graffiti font CSS |

### 1.8 Backup & Runtime Files

| Path | Type | Description |
|------|------|-------------|
| `server/replit_integrations/auth/replitAuth.ts.bak.20260108_051638` | Backup | Auth backup from Jan 8, 2026 |
| `devserver.log` | Log | Dev server log (8KB) |
| `devserver.pid` | PID | Process ID file |

### 1.9 Empty/Placeholder Directories

| Path | Description |
|------|-------------|
| `uploads/` | User upload directory (created by server) |
| `attached_assets/` | Unused asset directory |

---

## STEP 2 — FUNCTIONAL CLASSIFICATION

### A. Infrastructure

| Component | Justification |
|-----------|---------------|
| `server/index.ts` | HTTP server bootstrap, middleware setup, port binding |
| `server/routes.ts` | API route registration, authentication middleware |
| `server/db.ts` | Database connection initialization |
| `server/static.ts` | Static file serving for production |
| `server/vite.ts` | Development server integration |
| `server/replit_integrations/auth/*` | Authentication infrastructure |
| `script/build.ts` | Build pipeline infrastructure |
| `shared/routes.ts` | API contract definitions |
| All config files | Build/runtime infrastructure |

### B. Data Transformers

| Component | Justification |
|-----------|---------------|
| `server/storage.ts` | Data access layer - transforms requests to/from DB |
| `shared/schema.ts` | Schema definitions - transforms DB to TypeScript |
| `font-work/normalize_glyphs*.py` | Image normalization |
| `font-work/build_clock_font_*.py` | Font generation transforms |
| `font-work/graffiti_*/make_*.py` | Asset cleaning/transformation |

### C. Learners

**None identified.** No ML models, RL agents, or training code present.

### D. Experiments

| Component | Justification |
|-----------|---------------|
| `font-work/build_clock_font_from_eps.py` | Variant - experimental EPS approach |
| `font-work/build_clock_font_from_png.py` | Variant - experimental PNG approach |
| `font-work/build_clock_font_from_clean_eps.py` | Variant - cleaned EPS experiment |
| `font-work/normalize_glyphs.py` | V1 superseded by v2 |
| `client/src/components/Clock.tsx` | Font-based clock alternative |
| `font-work/glyph_png_bold/*` | Bold variant experiment |
| `font-work/glyph_png_clean/*` | Cleaned variant experiment |
| `font-work/months_outline_sets/*` | Outline variant experiments |

### E. Dead / Orphaned

| Component | Justification |
|-----------|---------------|
| `replitAuth.ts.bak.*` | Backup file - no runtime use |
| `devserver.log` | Log file - no code dependency |
| `devserver.pid` | Process file - no code dependency |
| `attached_assets/` | Empty directory - unused |
| `font-work/out_cells/*` | Intermediate outputs - likely superseded |
| `font-work/out_png/*` | Intermediate outputs - likely superseded |

---

## STEP 3 — EVIDENCE SCORING

### Scoring Criteria (0-2 per axis)

- **Purpose Clarity:** 0=unclear, 1=partially clear, 2=fully clear
- **Data Relevance:** 0=none, 1=indirect, 2=direct
- **Reusability:** 0=none, 1=limited, 2=high
- **Evidence of Use:** 0=none, 1=indirect, 2=direct imports/calls

### Core Application Scores

| Component | Purpose | Data | Reuse | Use | **Total** |
|-----------|---------|------|-------|-----|-----------|
| server/index.ts | 2 | 2 | 2 | 2 | **8** |
| server/routes.ts | 2 | 2 | 2 | 2 | **8** |
| server/storage.ts | 2 | 2 | 2 | 2 | **8** |
| server/db.ts | 2 | 2 | 1 | 2 | **7** |
| server/static.ts | 2 | 1 | 1 | 2 | **6** |
| server/vite.ts | 2 | 1 | 1 | 2 | **6** |
| server/replit_integrations/auth/* | 2 | 2 | 1 | 2 | **7** |
| shared/schema.ts | 2 | 2 | 2 | 2 | **8** |
| shared/routes.ts | 2 | 2 | 2 | 2 | **8** |
| client/src/main.tsx | 2 | 2 | 1 | 2 | **7** |
| client/src/App.tsx | 2 | 2 | 1 | 2 | **7** |
| client/src/pages/*.tsx | 2 | 2 | 1 | 2 | **7** |
| client/src/components/ui/* | 2 | 1 | 2 | 2 | **7** |
| client/src/hooks/* | 2 | 2 | 2 | 2 | **8** |
| client/src/lib/* | 2 | 1 | 2 | 2 | **7** |

### Font Pipeline Scores

| Component | Purpose | Data | Reuse | Use | **Total** |
|-----------|---------|------|-------|-----|-----------|
| build_clock_font_autoalign.py | 2 | 1 | 1 | 2 | **6** |
| glyph_svg/*.svg | 2 | 2 | 2 | 2 | **8** |
| JanGraffClock.ttf | 2 | 2 | 2 | 2 | **8** |
| JanGraffClock.woff2 | 2 | 2 | 2 | 2 | **8** |
| sheet.png | 2 | 2 | 2 | 2 | **8** |
| SpriteClock.tsx | 2 | 2 | 1 | 1 | **6** |
| Clock.tsx | 2 | 2 | 1 | 1 | **6** |
| normalize_glyphs_v2.py | 2 | 1 | 1 | 1 | **5** |

### Experiment/Variant Scores

| Component | Purpose | Data | Reuse | Use | **Total** |
|-----------|---------|------|-------|-----|-----------|
| build_clock_font_from_*.py | 1 | 1 | 0 | 0 | **2** |
| normalize_glyphs.py (v1) | 1 | 1 | 0 | 0 | **2** |
| glyph_png_bold/* | 1 | 1 | 0 | 0 | **2** |
| glyph_png_clean/* | 1 | 1 | 0 | 0 | **2** |
| months_outline_sets/* | 1 | 1 | 0 | 0 | **2** |

### Research Scores

| Component | Purpose | Data | Reuse | Use | **Total** |
|-----------|---------|------|-------|-----|-----------|
| research/AuditReport.md | 2 | 1 | 1 | 1 | **5** |
| research/InventorBrief.md | 2 | 1 | 1 | 1 | **5** |
| research/ClaimMatrix.csv | 2 | 1 | 1 | 1 | **5** |

### Dead/Orphaned Scores

| Component | Purpose | Data | Reuse | Use | **Total** |
|-----------|---------|------|-------|-----|-----------|
| replitAuth.ts.bak.* | 0 | 0 | 0 | 0 | **0** |
| devserver.log | 0 | 0 | 0 | 0 | **0** |
| devserver.pid | 0 | 0 | 0 | 0 | **0** |
| attached_assets/ | 0 | 0 | 0 | 0 | **0** |
| out_cells/, out_png/ | 1 | 0 | 0 | 0 | **1** |

---

## STEP 4 — RETENTION DECISIONS

### CORE (Must Keep) — 28+ Items

These components are essential for the application to function.

| Category | Components | Score |
|----------|------------|-------|
| **Backend** | server/index.ts, routes.ts, storage.ts, db.ts, static.ts, vite.ts | 6-8 |
| **Auth** | server/replit_integrations/auth/*.ts (4 files, excluding .bak) | 7 |
| **Shared** | shared/schema.ts, shared/routes.ts, shared/models/auth.ts | 8 |
| **Frontend Entry** | client/src/main.tsx, client/src/App.tsx | 7 |
| **Pages** | client/src/pages/*.tsx (4 files) | 7 |
| **UI Components** | client/src/components/ui/*.tsx (47), Navbar.tsx, StatusBadge.tsx | 6-7 |
| **Hooks/Lib** | client/src/hooks/*.ts (4), client/src/lib/*.ts (3) | 7-8 |
| **Client Assets** | client/src/assets/logos/* (8), public/fonts/*, favicon.png | 6 |
| **Styles** | client/src/styles/graff.css | 6 |
| **Font Output** | font-work/JanGraffClock.ttf, .woff2, sheet.png | 8 |
| **Font Source** | font-work/glyph_svg/*.svg (13), build_clock_font_autoalign.py | 6-8 |
| **Build** | script/build.ts, dist/* | 6 |
| **Config** | All *.json, *.ts config files | 6-7 |

### ARCHIVE (Keep but Quarantine) — 23+ Items

Historical value or may be needed for future font work.

| Category | Components | Score | Reason |
|----------|------------|-------|--------|
| **Research** | research/*.md, *.csv (3 files) | 5 | Decision documentation |
| **Font Processing** | normalize_glyphs_v2.py | 5 | May need for font updates |
| **Font Sources** | glyph_png/, glyph_png_norm/ | 4 | Raster sources |
| **Font Sources** | glyph_eps/, glyph_eps_clean/ | 4 | Vector sources |
| **Cleaned Assets** | digits_cells_clean/, months_cells_clean/ | 4 | Processed assets |
| **Singles** | months_singles/, numbers_singles/ | 4 | Individual assets |
| **Curated Packs** | graffiti_months_cleaned_pack/ | 4 | Has qc.json |
| **Curated Packs** | graffiti_numbers_cleaned_pack/ | 4 | Has qc.json, subdirs |
| **Alt Components** | Clock.tsx, SpriteClock.tsx | 6 | Alternative implementations |

### DELETE-CANDIDATE (Likely Safe to Remove) — 15 Items

No unique data, easily recreated, or superseded.

| Component | Score | Justification |
|-----------|-------|---------------|
| `replitAuth.ts.bak.20260108_051638` | 0 | Backup of current file |
| `devserver.log` | 0 | Regenerated on startup |
| `devserver.pid` | 0 | Regenerated on startup |
| `attached_assets/` | 0 | Empty directory |
| `font-work/out_cells/*` | 1 | Regenerable intermediates |
| `font-work/out_png/*` | 1 | Regenerable intermediates |
| `font-work/build_clock_font_from_eps.py` | 2 | Superseded by autoalign |
| `font-work/build_clock_font_from_png.py` | 2 | Superseded by autoalign |
| `font-work/build_clock_font_from_clean_eps.py` | 2 | Superseded by autoalign |
| `font-work/normalize_glyphs.py` (v1) | 2 | Superseded by v2 |
| `font-work/glyph_png_bold/*` | 2 | Unused variant |
| `font-work/glyph_png_clean/*` | 2 | Likely superseded |
| `font-work/digits_cells/*` | 2 | Cleaned version exists |
| `font-work/months/*` | 2 | Cleaned versions exist |
| `font-work/months_outline_sets/*` | 2 | Experimental variants |

**Estimated space recovery:** ~3-4MB

### REVIEW REQUIRED (Human Decision) — 3 Items

Ambiguous - requires human judgment.

| Component | Score | Issue |
|-----------|-------|-------|
| Clock.tsx vs SpriteClock.tsx | 6 | Two implementations - which is canonical? |
| graffiti_numbers_cleaned_pack/make_*.py | 3 | Nested script - still needed? |
| Multiple glyph format directories | 2-4 | Which are source vs intermediate? |

---

## STEP 5 — PROPOSED STRUCTURE

### Recommended Directory Layout

```
Service-Connect/
├── infra/                          # Infrastructure (build, deploy)
│   ├── script/
│   │   └── build.ts
│   └── config/
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── tailwind.config.ts
│       ├── drizzle.config.ts
│       ├── postcss.config.js
│       ├── components.json
│       └── .replit
│
├── server/                         # Backend (unchanged)
│   ├── index.ts
│   ├── routes.ts
│   ├── storage.ts
│   ├── db.ts
│   ├── static.ts
│   ├── vite.ts
│   └── replit_integrations/
│       └── auth/
│
├── client/                         # Frontend (unchanged)
│   ├── public/
│   ├── src/
│   └── index.html
│
├── shared/                         # Shared code (unchanged)
│   ├── schema.ts
│   ├── routes.ts
│   └── models/
│
├── data/                           # Data assets (NEW)
│   └── fonts/
│       ├── source/                 # Source vectors
│       ├── output/                 # Final fonts
│       └── sprites/                # Sprite sheets
│
├── dist/                           # Build output (unchanged)
│
├── uploads/                        # User uploads (unchanged)
│
├── archive/                        # Archived items (NEW)
│   ├── research/                   # Decision docs
│   ├── font-experiments/           # Superseded scripts
│   └── font-intermediates/         # Processing intermediates
│
└── docs/                           # Documentation (NEW)
    └── font-decisions.md
```

### Migration Mapping

| Current Location | Proposed Location |
|------------------|-------------------|
| `script/` | `infra/script/` |
| `*.json`, `*.ts` configs | `infra/config/` or root |
| `server/` | `server/` (no change) |
| `client/` | `client/` (no change) |
| `shared/` | `shared/` (no change) |
| `font-work/glyph_svg/` | `data/fonts/source/` |
| `font-work/*.ttf`, `*.woff2` | `data/fonts/output/` |
| `font-work/sheet.png` | `data/fonts/sprites/` |
| `font-work/build_clock_font_autoalign.py` | `data/fonts/build.py` |
| `research/` | `archive/research/` |
| `font-work/build_clock_font_from_*.py` | `archive/font-experiments/` |
| `font-work/normalize_glyphs.py` (v1) | `archive/font-experiments/` |
| `font-work/out_*`, non-essential glyph_* | `archive/font-intermediates/` |
| `dist/` | `dist/` (no change) |

---

## STEP 6 — FINAL REPORT

### High-Level Summary

**What Exists:**
- A functional **vehicle maintenance service request web application**
- React frontend + Express backend monorepo architecture
- PostgreSQL database with Drizzle ORM
- Replit OAuth authentication integration
- **Custom graffiti-style font system** for date/time display (351 files, 19MB)
- Production build artifacts present and functional

**Messiness Level:** MODERATE
- Core application code is clean and well-organized
- Font generation pipeline has significant artifact accumulation
- Research documentation appropriate but could be consolidated

**Main Risks:**
1. Font asset bloat (19MB for ~12KB of fonts)
2. Two competing clock implementations
3. Backup file in auth module indicates recent changes
4. Multiple superseded scripts causing confusion

### List of CORE Components

```
server/
├── index.ts           (entry point)
├── routes.ts          (API routes)
├── storage.ts         (data access)
├── db.ts              (database)
├── static.ts          (static files)
├── vite.ts            (dev server)
└── replit_integrations/auth/
    ├── index.ts
    ├── routes.ts
    ├── replitAuth.ts
    └── storage.ts

shared/
├── schema.ts          (DB schema)
├── routes.ts          (API contracts)
└── models/auth.ts     (types)

client/src/
├── main.tsx           (entry point)
├── App.tsx            (router)
├── pages/
│   ├── Home.tsx
│   ├── Dashboard.tsx
│   ├── SubmitRequest.tsx
│   └── not-found.tsx
├── components/
│   ├── Navbar.tsx
│   ├── StatusBadge.tsx
│   └── ui/ (47 files)
├── hooks/ (4 files)
├── lib/ (3 files)
├── styles/graff.css
└── assets/logos/ (8 files)

font-work/
├── JanGraffClock.ttf
├── JanGraffClock.woff2
├── sheet.png
├── glyph_svg/ (13 files)
└── build_clock_font_autoalign.py

script/build.ts
dist/
Config files (8)
```

### List of ARCHIVE Components

```
research/
├── AuditReport.md
├── InventorBrief.md
└── ClaimMatrix.csv

font-work/
├── normalize_glyphs_v2.py
├── glyph_png/
├── glyph_png_norm/
├── glyph_eps/
├── glyph_eps_clean/
├── digits_cells_clean/
├── months_cells_clean/
├── months_singles/
├── numbers_singles/
├── graffiti_months_cleaned_pack/
└── graffiti_numbers_cleaned_pack/

client/src/components/
├── Clock.tsx
└── SpriteClock.tsx
```

### List of DELETE-CANDIDATES

| File/Directory | Size | Safe to Delete |
|----------------|------|----------------|
| `replitAuth.ts.bak.*` | 4KB | YES - backup |
| `devserver.log` | 8KB | YES - regenerated |
| `devserver.pid` | 4KB | YES - regenerated |
| `attached_assets/` | 0 | YES - empty |
| `font-work/out_cells/` | 64KB | YES - regenerable |
| `font-work/out_png/` | 56KB | YES - regenerable |
| `font-work/build_clock_font_from_eps.py` | 4KB | YES - superseded |
| `font-work/build_clock_font_from_png.py` | 4KB | YES - superseded |
| `font-work/build_clock_font_from_clean_eps.py` | 4KB | YES - superseded |
| `font-work/normalize_glyphs.py` | 4KB | YES - superseded |
| `font-work/glyph_png_bold/` | 56KB | PROBABLY - unused |
| `font-work/glyph_png_clean/` | 56KB | PROBABLY - superseded |
| `font-work/digits_cells/` | 500KB | PROBABLY - cleaned exists |
| `font-work/months/` | 44KB | PROBABLY - cleaned exists |
| `font-work/months_outline_sets/` | 548KB | PROBABLY - experimental |

**Total potential recovery:** ~1.4MB confirmed, ~1.2MB probable

### Top 5 Areas of Confusion / Technical Debt

#### 1. Clock Component Duplication
**Issue:** Two implementations exist:
- `Clock.tsx` - Uses CSS font class `graffClock`
- `SpriteClock.tsx` - Uses sprite sheet positioning

**Evidence:** Both are in components/, neither clearly marked as deprecated.

**Recommendation:** Determine which is canonical and archive the other.

#### 2. Font Build Script Proliferation
**Issue:** Four build scripts exist:
- `build_clock_font_autoalign.py` (appears active)
- `build_clock_font_from_eps.py`
- `build_clock_font_from_png.py`
- `build_clock_font_from_clean_eps.py`

**Evidence:** Only `autoalign` has clear documentation and uses glyph_svg/.

**Recommendation:** Archive the three variants.

#### 3. Asset Directory Sprawl
**Issue:** 19+ subdirectories in font-work with overlapping content:
- `glyph_png`, `glyph_png_bold`, `glyph_png_clean`, `glyph_png_norm`
- Multiple "cells", "singles", "cleaned_pack" variants

**Evidence:** No manifest or README explaining the pipeline.

**Recommendation:** Create documentation or consolidate to source/output only.

#### 4. Implicit SERVICE_JSON Protocol
**Issue:** The `description` field uses undocumented encoding:
```javascript
const description = `SERVICE_JSON:${JSON.stringify(payload)}`;
```

**Evidence:** Found in SubmitRequest.tsx:149 and parsed in Dashboard.tsx:41-50.

**Recommendation:** Document this protocol or migrate to proper JSON column.

#### 5. Replit Platform Lock-in
**Issue:** Authentication is tightly coupled to Replit:
- Uses `openid-client` with Replit-specific discovery
- Platform config in `.replit`
- Replit-specific Vite plugins

**Evidence:** `server/replit_integrations/auth/` directory structure.

**Recommendation:** Document migration path if platform change needed.

### Recommended Canonical Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE-CONNECT PIPELINE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FONT GENERATION (one-time)                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ Source SVGs │───▶│ build_font  │───▶│ TTF/WOFF2   │         │
│  │ (glyph_svg) │    │ _autoalign  │    │ + sprites   │         │
│  └─────────────┘    └─────────────┘    └──────┬──────┘         │
│                                               │                 │
│                                               ▼                 │
│  RUNTIME                                                        │
│  ┌──────────────────────────────────────────────────────┐      │
│  │                    CLIENT (React)                     │      │
│  │  ┌──────────┐  ┌───────────┐  ┌─────────────────┐   │      │
│  │  │  Home    │  │  Submit   │  │    Dashboard    │   │      │
│  │  │  Page    │  │  Request  │  │   (auth req)    │   │      │
│  │  └──────────┘  └─────┬─────┘  └────────┬────────┘   │      │
│  └───────────────────────┼────────────────┼────────────┘      │
│                          │                │                    │
│                          ▼                ▼                    │
│  ┌──────────────────────────────────────────────────────┐      │
│  │                   SERVER (Express)                    │      │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐   │      │
│  │  │ POST /api/   │  │ GET/PATCH    │  │  Auth    │   │      │
│  │  │ requests     │  │ /api/req/:id │  │ /api/me  │   │      │
│  │  └──────┬───────┘  └──────┬───────┘  └────┬─────┘   │      │
│  └─────────┼─────────────────┼───────────────┼─────────┘      │
│            │                 │               │                 │
│            └─────────────────┼───────────────┘                 │
│                              ▼                                  │
│                        ┌──────────┐                            │
│                        │PostgreSQL│                            │
│                        │(Drizzle) │                            │
│                        └──────────┘                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Customer Flow:**
   - Visit `/` (Home) → See branding/logos
   - Click "Submit Service Request" → `/submit`
   - Fill form (services, vehicle info, contact)
   - Submit → POST `/api/requests`
   - Data stored in `maintenance_requests` table

2. **Admin Flow:**
   - Visit `/dashboard`
   - If not authenticated → Redirect to Replit OAuth
   - After auth → GET `/api/requests` (list all)
   - Click "Manage" → View/update work order
   - Update → PATCH `/api/requests/:id`

3. **Font/Clock Flow:**
   - Fonts loaded via CSS `@font-face` or sprite sheet
   - Clock component updates every second
   - Displays graffiti-style date/time

---

## APPENDICES

### Appendix A: File Counts by Category

| Category | File Count | Size |
|----------|------------|------|
| Core Application (TS/TSX) | 69 | ~7MB |
| UI Library (shadcn) | 47 | ~500KB |
| Font Assets | 351 | 19MB |
| Build Output | ~50 | 2.5MB |
| node_modules | ~15,000+ | 387MB |
| Config | 8 | ~50KB |
| Research | 3 | ~10KB |
| **Total (excl node_modules)** | **~480** | **~29MB** |

### Appendix B: Database Schema

```sql
-- Sessions table (auth)
CREATE TABLE sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);
CREATE INDEX idx_session_expire ON sessions(expire);

-- Users table
CREATE TABLE users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Maintenance Requests table
CREATE TABLE maintenance_requests (
  id SERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  contact_info TEXT NOT NULL,
  vehicle_info TEXT NOT NULL,
  vehicle_color TEXT,
  mileage INTEGER,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  is_urgent BOOLEAN DEFAULT FALSE,
  work_done TEXT,
  parts_used TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Appendix C: API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/me` | No | Get current user (null if not logged in) |
| GET | `/api/login` | No | Initiate Replit OAuth |
| GET | `/api/logout` | No | End session |
| GET | `/api/requests` | Yes | List all maintenance requests |
| GET | `/api/requests/:id` | Yes | Get single request |
| POST | `/api/requests` | No | Create new request |
| PATCH | `/api/requests/:id` | Yes | Update request |
| POST | `/api/uploads` | No | Upload files (multipart) |

### Appendix D: NPM Scripts

```json
{
  "dev": "NODE_ENV=development tsx server/index.ts",
  "build": "tsx script/build.ts",
  "start": "NODE_ENV=production node dist/index.cjs",
  "check": "tsc",
  "db:push": "drizzle-kit push"
}
```

### Appendix E: Dependencies Summary

**Runtime (81 packages):**
- React ecosystem: react, react-dom, wouter, @tanstack/react-query
- UI: @radix-ui/* (22 packages), tailwind-merge, lucide-react
- Forms: react-hook-form, @hookform/resolvers, zod
- Backend: express, passport, openid-client, pg, drizzle-orm
- Animation: framer-motion
- Charts: recharts

**Development (23 packages):**
- Build: vite, esbuild, tsx, typescript
- Types: @types/* (10 packages)
- CSS: tailwindcss, postcss, autoprefixer
- ORM: drizzle-kit
- Replit: @replit/vite-plugin-*

### Appendix F: Service Categories (SubmitRequest.tsx)

```typescript
const SERVICE_GROUPS = {
  filters: ["Oil filter", "Fuel filter(s)", "Air filter", "DEF filter"],
  fluids: ["Engine oil", "Transmission fluid", "Differential fluid(s)", "Coolant"],
  gaskets: [
    "Oil pan gasket", "Valve cover gasket", "Oil pump tube seals",
    "Turbo gasket / o-ring", "Exhaust gasket / seal",
    "Front crank seal + cover", "Rear crank seal", "Oil pump"
  ],
  components: [
    "Radiator", "CAC (charge air cooler)", "Turbo", "EGR cooler",
    "Fuel pump", "Air compressor", "Transmission clutch",
    "Alternator", "Water pump", "Valve adjustment"
  ]
};

const ENGINE_OIL_WEIGHTS = ["5W-40", "15W-40"];
const ENGINE_OIL_TYPES = ["Blend", "Synthetic"];
```

---

## DOCUMENT METADATA

| Field | Value |
|-------|-------|
| Generated | 2026-01-15 |
| Format | Markdown |
| Tool | Automated forensic analysis |
| Status | Read-only analysis (no modifications made) |
| Confidence | High for core components, Medium for font pipeline |

---

*This report is based on static analysis of file contents, imports, and structure. Runtime behavior was inferred from code patterns. All recommendations are non-destructive. Human review required before any deletion or restructuring.*