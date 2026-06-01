# LearnFlow scripts

Start the **full stack** (FastAPI backend + Next.js frontend) with one command.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev:all` | **Start everything** — setup (first run) + DB + backend + frontend |
| `npm run app` | Same as `dev:all` |
| `npm run setup` | Install deps, database, Alembic migrations only |
| `npm run stop` | Stop FastAPI and Docker Postgres |

```bash
bash scripts/start-dev.sh   # recommended
bash scripts/setup.sh
bash scripts/stop.sh
```

## Architecture

| Service | URL | Tech |
|---------|-----|------|
| Frontend | http://localhost:3000 | Next.js 14 |
| Backend API | http://localhost:8000 | FastAPI (Python) |
| API docs | http://localhost:8000/docs | Swagger UI |

The frontend calls the backend via `NEXT_PUBLIC_API_URL` (see `src/lib/api.ts`).

## Requirements

- Node.js 18+
- Python 3.11+
- Docker (recommended for PostgreSQL on port **5433**)
