# LearnFlow

AI-powered personal tutor platform.

## Tech stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy, Alembic |
| **Database** | PostgreSQL |
| **AI** | OpenRouter via **Next.js** API routes (`/api/ai/*`) |
| **Deploy** | Vercel (frontend) + any Python host (backend) |

Most data APIs are proxied from Next.js to FastAPI (`NEXT_PUBLIC_API_URL`). **AI chat, quiz, and summarize** call OpenRouter from the Next.js server using `OPENROUTER_API_KEY` in `.env.local`. FastAPI `/api/v1/ai/*` routes intentionally return 501 with a pointer to the Next.js endpoints.

---

## Quick start

```bash
# First time (Postgres, deps, migrations)
npm run setup

# Start Postgres + FastAPI + Next.js
npm run dev:all
```

- Frontend: http://localhost:3000  
- Backend: http://localhost:8000  
- API docs: http://localhost:8000/docs  

See [docs/LOGIN.md](docs/LOGIN.md) for sign-in and [docs/TESTING.md](docs/TESTING.md) for a recommended test order before adding your OpenRouter key.

---

## Minimum `.env.local`

Copy from `.env.example` if needed (`npm run setup` creates `.env.local` automatically).

```env
AUTH_SECRET=<openssl rand -base64 32>
AUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/learnflow
FRONTEND_URL=http://localhost:3000
```

### Enable AI (OpenRouter)

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

Restart `npm run dev:all` after changing env vars.

### Optional

| Variable | Feature |
|----------|---------|
| `RESEND_API_KEY` | Magic-link login, reminder emails |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google sign-in |
| `UPLOADTHING_SECRET` / `UPLOADTHING_APP_ID` | Note file uploads |
| `CRON_SECRET` | Vercel cron (reminders, 30-day deleted-session purge) |

---

## Database migrations

After pulling new code:

```bash
cd backend && .venv/bin/alembic upgrade head
```

Or run `npm run setup` on first clone.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run setup` | Install deps, DB, migrations |
| `npm run dev:all` | Full dev stack |
| `npm run dev` | Next.js only |
| `npm run dev:backend` | FastAPI only |
| `npm run build` | Production Next.js build |
