# Testing LearnFlow locally

Recommended order before you treat the app as ready. You can stop after any step if you only care about that area.

## Prerequisites

1. `npm run setup` completed without errors  
2. `npm run dev:all` running (frontend `:3000`, backend `:8000`)  
3. `.env.local` at the project root with at least:

```env
AUTH_SECRET=<32+ characters>
AUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/learnflow
FRONTEND_URL=http://localhost:3000
```

If study features fail with database column errors, run:

```bash
cd backend && .venv/bin/alembic upgrade head
```

---

## Step 1 — Auth and dashboard (no OpenRouter)

1. Open http://localhost:3000/register  
2. Create an account (email + password)  
3. Complete onboarding if redirected  
4. Confirm the dashboard loads (stats cards, charts)

See [LOGIN.md](./LOGIN.md) for troubleshooting.

---

## Step 2 — Study tab (no OpenRouter)

1. Go to **Study**  
2. Add subjects (pills), start a session, pause/resume, end session  
3. Log time in the modal (or skip)  
4. Return to **Dashboard** — activity bar chart and **Time by Subject** pie chart should reflect logged time  
5. Optional: delete a past session → check **Deleted Sessions** panel → restore or purge permanently  

---

## Step 3 — Profile and subject merge (no OpenRouter)

1. Go to **Profile** → edit subjects  
2. Expand **Subject Merge Tool** (`#subject-merge-tool`)  
3. If duplicates appear in stats, try a merge and refresh the dashboard chart  

---

## Step 4 — Add OpenRouter and test AI

1. Add to `.env.local`:

```env
OPENROUTER_API_KEY=sk-or-v1-your-real-key
```

2. Restart the dev stack (`Ctrl+C`, then `npm run dev:all`)  
3. **AI Tutor** — send a message; you should get a streaming reply  
4. **Quiz** — generate a quiz  
5. **Notes** — summarize (if the note editor uses summarize)  

Models are defined in `src/lib/openrouter.ts` (tutor, quiz, summary). Your OpenRouter account must have access to those models.

If you see `OPENROUTER_API_KEY is not configured`, the key is missing or the server was not restarted after editing `.env.local`.

---

## Step 5 — Optional integrations

| Feature | Env vars |
|---------|----------|
| Magic link login | `RESEND_API_KEY`, `EMAIL_FROM` |
| Google login | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` |
| Note uploads | `UPLOADTHING_*` |
| Reminder emails (cron) | `RESEND_API_KEY`, `CRON_SECRET` |

---

## Cron jobs (production / manual)

Configured in `vercel.json`:

- `/api/cron/reminders` — every 5 minutes (needs `RESEND_API_KEY`)  
- `/api/cron/purge-deleted-sessions` — daily at 03:00 UTC (removes sessions soft-deleted **> 30 days** ago)

Local manual trigger (replace secret):

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/purge-deleted-sessions
```
