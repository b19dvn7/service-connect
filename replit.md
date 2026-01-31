# HeavyDuty Ops - Fleet Maintenance Request System

## Overview

A full-stack web application for managing heavy-duty truck fleet maintenance requests. Customers can submit work orders describing vehicle issues, and administrators can track, update, and manage these requests through a protected dashboard. The system uses Replit Auth for admin authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state caching and synchronization
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style variant)
- **Animations**: Framer Motion for page transitions and UI effects
- **Form Handling**: React Hook Form with Zod validation
- **Design Theme**: Industrial/automotive aesthetic with dark mode default, custom fonts (Teko, Rajdhani)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Design**: REST endpoints defined in shared route definitions with Zod schemas for type-safe validation
- **Build Tool**: Vite for frontend, esbuild for server bundling
- **Development**: Hot module replacement via Vite dev server proxied through Express

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Drizzle Kit with `db:push` command for schema synchronization
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple

### Authentication
- **Provider**: Replit Auth (OpenID Connect)
- **Session Management**: Express sessions stored in PostgreSQL `sessions` table
- **Protected Routes**: Dashboard and request management require authentication
- **Public Routes**: Home page and request submission are accessible without login
- **Local Auth (optional)**: Set `SIMPLE_AUTH_USER` and `SIMPLE_AUTH_PASS` to enable a basic username/password login form when not using Replit OIDC
- **App Login Page (optional)**: Set `VITE_USE_APP_LOGIN=true` to use the in-app `/login` screen instead of `/api/login`
- **Session Timeout (optional)**: Set `SIMPLE_AUTH_MAX_AGE_HOURS` to control how long simple-auth sessions stay active (default: 4 hours with rolling activity).

### Key Design Patterns
- **Shared Types**: Schema definitions and route types shared between client and server via `@shared/*` path alias
- **Type-Safe API**: Zod schemas define both request validation and response types
- **Storage Abstraction**: `IStorage` interface allows swapping database implementations
- **Modular Auth**: Authentication logic isolated in `server/replit_integrations/auth/`

## External Dependencies

### Database
- PostgreSQL database (provisioned via Replit)
- Environment variable: `DATABASE_URL`

### Authentication
- Replit OpenID Connect provider
- Environment variables: `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`
- Optional local auth: `SIMPLE_AUTH_USER`, `SIMPLE_AUTH_PASS`
- Optional app login UI: `VITE_USE_APP_LOGIN=true`
- Optional session TTL: `SIMPLE_AUTH_MAX_AGE_HOURS`

### UI Component Library
- shadcn/ui components built on Radix UI primitives
- Full component set including dialogs, forms, toasts, and navigation elements

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit`: Database ORM and migrations
- `@tanstack/react-query`: Data fetching and caching
- `openid-client` / `passport`: Authentication flow
- `express-session` / `connect-pg-simple`: Session management
- `zod` / `drizzle-zod`: Schema validation and type generation
