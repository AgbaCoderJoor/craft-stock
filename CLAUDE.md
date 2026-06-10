# CraftStock — Claude Code Rules

## Project Overview

**CraftStock** is an inventory management system for Larah's craft/goods business. It tracks raw materials, stock movements, finished goods, and generates reports. Built as a free-tier monorepo with a Next.js frontend and Express backend.

```
craftstock/
├── apps/
│   ├── frontend/     # Next.js 14 App Router — Vercel
│   └── backend/      # Node.js + Express — Render.com
├── .env.example
└── README.md
```

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | Next.js (App Router) | 14.x |
| Styling | Tailwind CSS + shadcn/ui | latest |
| Data fetching | @tanstack/react-query | v5 |
| Forms | React Hook Form + Zod | latest |
| HTTP client | Axios | latest |
| Backend | Node.js + Express | 20.x / 4.x |
| Language | TypeScript | 5.x |
| ORM | Prisma | latest |
| Database | Neon (PostgreSQL) | 16.x |
| Auth | jsonwebtoken + bcryptjs | — |
| Validation | Zod (both ends) | latest |
| Frontend host | Vercel | free |
| Backend host | Render.com | free |

---

## Project Structure

### Backend (`apps/backend/src/`)
```
config/         # Prisma client singleton (db.ts)
middleware/     # auth.middleware.ts, rbac.middleware.ts, audit.middleware.ts
modules/        # Feature modules (auth, materials, stock-movements, finished-goods, audit-logs)
  └── <module>/
      ├── <module>.router.ts
      ├── <module>.controller.ts
      └── <module>.service.ts
utils/
app.ts          # Express entry point
prisma/
  schema.prisma
```

### Frontend (`apps/frontend/`)
```
app/
  (auth)/login/
  (dashboard)/
    layout.tsx
    page.tsx                  # Dashboard
    materials/
    stock-movements/
    finished-goods/
    reports/
    audit-logs/
components/
  ui/                         # shadcn/ui primitives
  layout/                     # Sidebar, Header, etc.
  features/                   # Domain components (materials/, stock/, reports/)
lib/
  api.ts                      # Axios instance with JWT interceptor
  auth.ts                     # JWT helpers
  query-client.ts             # React Query client config
types/
  index.ts                    # Shared TS types
middleware.ts                 # Next.js route guard (RBAC)
```

---

## Development Commands

```bash
# Backend (Terminal 1)
cd apps/backend
npm run dev          # nodemon + ts-node on port 4000

# Frontend (Terminal 2)
cd apps/frontend
npm run dev          # Next.js on port 3000

# Database migrations
cd apps/backend
npx prisma migrate dev --name <description>   # create + apply migration
npx prisma migrate deploy                      # apply in production
npx prisma db seed                             # seed roles + default admin
npx prisma studio                              # open DB GUI

# Build verification
cd apps/backend && npm run build
cd apps/frontend && npm run build
```

---

## Architecture Conventions

### Backend Module Pattern
Every feature module follows: **router → controller → service**
- Router: attaches `authenticate` + `authorize(roles)` middleware, delegates to controller
- Controller: parse/validate request with Zod, call service, return response
- Service: all Prisma queries live here — no raw DB calls in controllers

### Middleware Chain Order
```
authenticate → authorize(...roles) → handler
```
All mutating routes must call `logAudit()` from `audit.middleware.ts` after the operation.

### Error Handling
- Never swallow errors silently — always surface them explicitly
- Use `try/catch` in async controllers; pass errors to `next(err)`
- HTTP status codes: 400 (bad input), 401 (unauth), 403 (forbidden), 404 (not found), 500 (server)
- Zod parse failures → 400 with structured field errors

### Prisma Usage
- Import the singleton from `config/db.ts`, never instantiate `PrismaClient` directly
- Use `DATABASE_URL` (pooled) for all runtime queries
- Use `DIRECT_URL` only for `prisma migrate deploy`

---

## Frontend Conventions

### App Router Patterns
- Route groups: `(auth)` for unauthenticated pages, `(dashboard)` for protected pages
- `middleware.ts` handles JWT check + role-based redirects for all non-auth routes
- Server components for static/data-fetching layout; client components for interactive UI

### Data Fetching
- All API calls go through `lib/api.ts` (Axios instance with Bearer token interceptor)
- Use React Query `useQuery` for reads, `useMutation` for writes
- Invalidate relevant query keys after mutations
- On 401 response: interceptor clears token and redirects to `/login`

### Component Organization
- `components/ui/` — shadcn primitives only (no business logic)
- `components/layout/` — Sidebar, Header, page shells
- `components/features/<module>/` — domain-specific components

### Forms
- React Hook Form + Zod resolver for all forms
- Match Zod schemas on frontend to backend validation schemas

---

## Auth & RBAC

### JWT Flow
1. `POST /auth/login` → returns `{ token, user }`
2. Token stored in `localStorage`; injected via Axios interceptor
3. Token payload: `{ user_id, role, email, exp: 24h }`
4. `middleware.ts` decodes token from cookie for server-side route protection

### User Registration (Admin-only)
No public self-registration. Admins create users via:
- **Backend:** `POST /auth/register` (requires admin JWT) — body: `{ name, email, password, role_name }`
- **Frontend:** `/users` page — admin-only UI to add/remove users with role assignment
- **Bootstrap:** First admin created via `npx prisma db seed` (`admin@craftstock.com` / `changeme123`)

### Roles & Permissions
| Role | Access |
|---|---|
| `admin` | Full access — all modules including audit logs and user management |
| `store_manager` | Materials CRUD, stock movements (issue + approve), finished goods |
| `production_staff` | Create movements, view materials, log production |
| `viewer` | Read-only across all modules |

Use `authorize('admin', 'store_manager')` on routes — never hardcode role checks in business logic.

---

## Database (Neon PostgreSQL)

- **Always-on** free tier (no pause on inactivity — preferred over Supabase)
- Enable connection pooling in Neon dashboard (Serverless → Enable pooling)
- Two connection strings required:
  - `DATABASE_URL` — pooled endpoint (runtime)
  - `DIRECT_URL` — direct endpoint (migrations only)

### Core Models
`Role` → `User` → `StockMovement` (issued/approved/confirmed by User)
`Material` → `StockMovement`
`FinishedGood` → `StockMovement`
`AuditLog` → `User`

---

## Environment Variables

### Backend (`apps/backend/.env`)
```
DATABASE_URL=postgresql://USER:PASS@ep-xxx.pooler.neon.tech/craftstock?sslmode=require
DIRECT_URL=postgresql://USER:PASS@ep-xxx.neon.tech/craftstock?sslmode=require
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend (`apps/frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## Behavioral Rules

1. **Edit existing files first** — never create a new file if an existing one can be extended
2. **No silent error handling** — every `catch` must surface the error explicitly; no empty catch blocks
3. **Binary status** — operations are pass or fail; no ambiguous intermediate states returned to callers
4. **Zod on both ends** — validate at the API boundary (backend controllers) and form boundary (frontend) — never rely on TypeScript types alone for runtime safety
5. **Audit all mutations** — every create/update/delete must call `logAudit()` with old and new values
6. **No role logic in UI** — use `middleware.ts` and backend `authorize()` for access control; don't conditionally render based on role as the sole guard
7. **Run builds after scaffolding** — after generating new modules, run `npm run build` to verify before continuing

---

## Deployment

| Service | Provider | Notes |
|---|---|---|
| Frontend | Vercel | Set `NEXT_PUBLIC_API_URL` to Render backend URL |
| Backend | Render.com | Build: `npm install && npx prisma generate && npm run build` · Start: `npm start` |
| Database | Neon | Always-on; enable pooling in dashboard |

> Render free tier spins down after 15 min idle — first request after idle ~30s. Acceptable for MVP.

**Git branching:** `main` (prod auto-deploy) → `dev` (staging) → `feature/*` (PR into dev)

---

## MVP Roadmap

- **Phase 1 (DONE):** Auth, Materials CRUD + low-stock alerts, Stock movements (approve/confirm flow), Finished goods, Audit logs, Dashboard KPIs, Reports summary
- **Phase 2:** Reports with date-range filter, email alerts via Resend (free: 3k/mo), CSV export
- **Phase 3:** POS integration, barcode scanning, multi-branch, mobile (PWA)

**Default admin:** `admin@craftstock.com` / `changeme123` — change immediately after first login.

---

## Implementation Notes

### UI Library
shadcn components use **Tailwind v3 + Radix UI** primitives (not shadcn v4/base-ui). All components in `components/ui/` are hand-written against `@radix-ui/react-*`. Do not run `npx shadcn@latest add` — it will overwrite with incompatible v4 components.

### Forms
All forms use `react-hook-form` with `{ valueAsNumber: true }` on numeric inputs instead of `z.coerce.number()` — avoids TypeScript resolver incompatibility with the installed zod version.

### Build Commands (Verified)
```bash
# Backend
cd apps/backend && npm run build   # tsc -p tsconfig.build.json → dist/

# Frontend  
cd apps/frontend && npm run build  # next build — all 11 pages pass clean
```
