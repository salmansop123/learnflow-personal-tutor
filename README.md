# LearnFlow

LearnFlow is an AI-powered study platform built to help students learn faster and organize their study workflow. It combines a modern web frontend with a Python API backend, AI tutoring, note management, quizzes, study planning, and reminders.

## What LearnFlow does

- AI Tutor: chat-based tutoring with guided explanations and subject assistance.
- Smart Quizzes: generate quizzes and interactive questions based on the user profile.
- Notes Workspace: create, edit, summarize, and export notes.
- Study Sessions: track study time, sessions, and subject progress.
- Reminders: schedule reminders and email notifications.
- Onboarding: personalize learning by collecting identity, goals, education level, subjects, and exam targets.
- Authentication: supports magic-link / email login and Google sign-in.

## Architecture

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Python 3.11+, FastAPI, SQLAlchemy, Alembic |
| Database | PostgreSQL |
| AI | OpenRouter via Next.js server routes |
| Deployment | Vercel for frontend + any Python host for backend |

## Project structure

- `src/` - Next.js frontend app, components, hooks, and shared utilities.
- `backend/` - FastAPI backend service, API routes, models, schemas, and services.
- `assets/screenshots/` - screenshot gallery for the project UI.
- `docs/` - supporting documentation for login and testing.
- `scripts/` - development and setup scripts.

## Frontend features

- Marketing pages, pricing, and contact sections.
- Auth flow with login, signup, verify, and forgot password.
- Dashboard with activity summary, recent chats, subject analytics, and reminders.
- Notes management, including PDF export and document upload.
- AI tutor experience with conversation UI and note pinning.
- Quiz flow with question cards, results, and history.
- Settings, profile onboarding, and theme switching.

## Backend features

- FastAPI API under `backend/app/`.
- Auth, user management, profile, notes, study sessions, quizzes, reminders, and cron routes.
- Health checks and API error handling.
- CORS support for frontend integration.
- Alembic migrations in `backend/alembic/`.

## Screenshots

### Homepage screenshots

1. Homepage 1
   ![](assets/screenshots/LearnFlow%20Homepage%20-%201.png)
2. Homepage 2
   ![](assets/screenshots/LearnFlow%20Homepage%20-%202.png)
3. Homepage 3
   ![](assets/screenshots/LearnFlow%20Homepage%20-%203.png)
4. Homepage 4
   ![](assets/screenshots/LearnFlow%20Homepage%20-%204.png)
5. Homepage 5
   ![](assets/screenshots/LearnFlow%20Homepage%20-%205.png)
6. Homepage 6
   ![](assets/screenshots/LearnFlow%20Homepage%20-%206.png)
7. Homepage 7
   ![](assets/screenshots/LearnFlow%20Homepage%20-%207.png)
8. Homepage 8
   ![](assets/screenshots/LearnFlow%20Homepage%20-%208.png)
9. Homepage 9
   ![](assets/screenshots/LearnFlow%20Homepage%20-%209.png)
10. Homepage 10
    ![](assets/screenshots/LearnFlow%20Homepage%20-%2010.png)

    ### Contact screenshot

- Contact Us page
  ![](assets/screenshots/Contact%20US%20page.png)

    ### Auth screenshots

1. Sign In
   ![](assets/screenshots/Sign%20In.png)
2. Register / Sign-up
   ![](assets/screenshots/Register%20Sign-up.png)

> All screenshots are included from `assets/screenshots/`.


### Dashboard screenshots

1. Dashboard 1
   ![](assets/screenshots/LearnFlow%20Dashboard%20-%201.png)
2. Dashboard 2
   ![](assets/screenshots/LearnFlow%20Dashboard%20-%202.png)
3. Dashboard 3
   ![](assets/screenshots/LearnFlow%20Dashboard%20-%203.png)
4. Dashboard 4
   ![](assets/screenshots/LearnFlow%20Dashboard%20-%204.png)
5. Dashboard 5
   ![](assets/screenshots/LearnFlow%20Dashboard%20-%205.png)
6. Dashboard 6
   ![](assets/screenshots/LearnFlow%20Dashboard%20-%206.png)
7. Dashboard 7
   ![](assets/screenshots/LearnFlow%20Dashboard%20-%207.png)
8. Dashboard 8
   ![](assets/screenshots/LearnFlow%20Dashboard%20-%208.png)
9. Dashboard 9
   ![](assets/screenshots/LearnFlow%20Dashboard%20-%209.png)
10. Dashboard 10
    ![](assets/screenshots/LearnFlow%20Dashboard%20-%2010.png)
11. Dashboard 11
    ![](assets/screenshots/LearnFlow%20Dashboard%20-%2011.png)
12. Dashboard 12
    ![](assets/screenshots/LearnFlow%20Dashboard%20-%2012.png)
13. Dashboard 13
    ![](assets/screenshots/LearnFlow%20Dashboard%20-%2013.png)
14. Dashboard 14
    ![](assets/screenshots/LearnFlow%20Dashboard%20-%2014.png)
15. Dashboard 15
    ![](assets/screenshots/LearnFlow%20Dashboard%20-%2015.png)
16. Dashboard 16
    ![](assets/screenshots/LearnFlow%20Dashboard%20-%2016.png)
17. Dashboard 17
    ![](assets/screenshots/LearnFlow%20Dashboard%20-%2017.png)
18. Dashboard 18
    ![](assets/screenshots/LearnFlow%20Dashboard%20-%2018.png)
19. Dashboard 19
    ![](assets/screenshots/LearnFlow%20Dashboard%20-%2019.png)

### Dashboard dark theme screenshots

1. Dark theme 1
   ![](assets/screenshots/LearnFlow%20dashboard%20dark%20theme%20-%201.png)
2. Dark theme 2
   ![](assets/screenshots/LearnFlow%20dashboard%20dark%20theme%20-%202.png)
3. Dark theme 3
   ![](assets/screenshots/LearnFlow%20dashboard%20dark%20theme%20-%203.png)
4. Dark theme 4
   ![](assets/screenshots/LearnFlow%20dashboard%20dark%20theme%20-%204.png)
5. Dark theme 5
   ![](assets/screenshots/LearnFlow%20dashboard%20dark%20theme%20-%205.png)
6. Dark theme 6
   ![](assets/screenshots/LearnFlow%20dashboard%20dark%20theme%20-%206.png)
7. Dark theme 7
   ![](assets/screenshots/LearnFlow%20dashboard%20dark%20theme%20-%207.png)
   
## Quick start

```bash
npm run setup
npm run dev:all
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

## Environment configuration

Copy `.env.example` to `.env.local` and update values.

Minimum required variables:

```env
AUTH_SECRET=<openssl rand -base64 32>
AUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/learnflow
FRONTEND_URL=http://localhost:3000
```

### OpenRouter AI configuration

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

### Optional environment variables

| Variable | Feature |
|----------|---------|
| `RESEND_API_KEY` | Magic-link login and reminder email delivery |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google authentication |
| `UPLOADTHING_SECRET` / `UPLOADTHING_APP_ID` | File uploads for notes |
| `CRON_SECRET` | Cron endpoints for reminders and cleanup |

Restart `npm run dev:all` after changing environment variables.

## Backend setup

After cloning the repo, install backend dependencies and run migrations:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
.venv/bin/alembic upgrade head
```

If you use the root setup script, this is handled by `npm run setup`.

## Useful scripts

| Command | Description |
|---------|-------------|
| `npm run setup` | Install dependencies, initialize DB, run migrations |
| `npm run dev:all` | Start frontend and backend together |
| `npm run dev` | Start only the Next.js frontend |
| `npm run dev:backend` | Start only the FastAPI backend |
| `npm run build` | Build the Next.js app for production |
| `npm run stop` | Stop running services |

## Notes

- The frontend proxies many requests to the backend using `NEXT_PUBLIC_API_URL`.
- AI chat, quizzes, and summaries use OpenRouter from the Next.js server.
- Backend `/api/v1/ai/*` routes are intentionally stubbed to point to the frontend AI endpoints.
- See `docs/LOGIN.md` for login flow details and `docs/TESTING.md` for recommended testing order.
