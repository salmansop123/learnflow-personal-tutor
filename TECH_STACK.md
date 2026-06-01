# LearnFlow — Tech stack (updated)

## Architecture

```
┌─────────────────────┐         HTTP (REST)        ┌─────────────────────┐
│   Next.js Frontend  │  ──────────────────────► │  FastAPI Backend    │
│   localhost:3000    │   NEXT_PUBLIC_API_URL    │  localhost:8000     │
│   (React / RSC)     │                          │  (Python)           │
└─────────────────────┘                          └──────────┬──────────┘
                                                            │
                                                            ▼
                                                 ┌─────────────────────┐
                                                 │     PostgreSQL      │
                                                 └─────────────────────┘
```

## Frontend (Next.js only)

- Next.js 14 App Router, TypeScript, Tailwind, shadcn/ui
- Framer Motion, Recharts, Zustand, Zod
- NextAuth.js (session UI — integrates with backend in Phase 2)
- Next.js **API routes** proxy data to FastAPI; **AI** (`/api/ai/*`) uses OpenRouter directly

## Backend (Python only)

- **FastAPI** — REST API + OpenAPI docs
- **SQLAlchemy 2** — ORM (same schema as original Prisma models)
- **Alembic** — migrations
- **Uvicorn** — ASGI server
- OpenRouter key in `.env.local` (used by Next.js AI routes); Resend/cron also via env

## What moved from Next.js to Python

| Before (Node) | After (Python) |
|---------------|----------------|
| `src/app/api/*` (except NextAuth) | `backend/app/api/v1/*` |
| Prisma + `src/lib/db.ts` | SQLAlchemy + Alembic |
| Server-side AI in API routes | Next.js `/api/ai/*` (FastAPI `/ai` returns 501) |
| Cron reminders route | FastAPI + scheduler (Phase 10) |

## Authentication (Phase 2)

| Layer | Responsibility |
|-------|----------------|
| **Next.js** | NextAuth.js (Google OAuth + JWT session), `middleware.ts`, login UI |
| **FastAPI** | Users, accounts, sessions, magic-link tokens in PostgreSQL; Resend emails |

Magic link flow: FastAPI sends email → user opens `/login/verify` → FastAPI validates token → NextAuth Credentials session.

## Environment variables

Single `.env.local` at project root — shared by Next.js and FastAPI (see `.env.example`).
