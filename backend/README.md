# LearnFlow Backend (FastAPI)

Python API server for LearnFlow. The Next.js app in the repo root is the **frontend only**.

## Stack

- **FastAPI** — REST API
- **SQLAlchemy** — ORM
- **Alembic** — migrations
- **PostgreSQL** — database

## Run locally

From the **project root**:

```bash
npm run app
```

Or backend only:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API: http://localhost:8000  
- Swagger: http://localhost:8000/docs  
- Health: http://localhost:8000/api/v1/health  

## Migrations

```bash
cd backend
source .venv/bin/activate
alembic upgrade head
alembic revision --autogenerate -m "description"
```

## API routes (scaffold)

| Prefix | Description |
|--------|-------------|
| `/api/v1/health` | Health check |
| `/api/v1/notes` | Notes CRUD |
| `/api/v1/study/*` | Sessions, plans, tasks |
| `/api/v1/ai/*` | Chat, quiz, summarize |
| `/api/v1/reminders` | Reminders |

Environment variables are loaded from the root `.env.local` (see root `.env.example`).
