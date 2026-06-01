# How to log in and view the dashboard

## 1. Start the app

From the project root:

```bash
npm run dev:all
```

Wait until you see:

- Frontend: http://localhost:3000
- Backend: http://localhost:8000

## 2. Create an account (first time)

1. Open **http://localhost:3000/register**
2. Fill in:
   - **Name** — e.g. `Test Student`
   - **Email** — e.g. `student@test.com`
   - **Password** — 8 to 24 characters
   - **Confirm password** — same as password
3. Click **Create account**
4. You are redirected to **http://localhost:3000/dashboard**

No email or Google setup is required for this flow.

## 3. Sign in (returning user)

1. Open **http://localhost:3000/login**
2. Enter your **email** and **password**
3. Click **Sign in**
4. You land on the dashboard

## 4. Optional: magic link

On the login page, enter your email and click **Send magic link instead** (requires `RESEND_API_KEY` in `.env.local`). Open the link in your email to sign in.

## 5. Optional: Google

Set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in `.env.local`, then use **Continue with Google** on login or register.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Invalid email or password" | Register first, or check email/password |
| Cannot reach API | Ensure backend is running on port 8000 |
| Database error | Run `npm run setup` or `cd backend && alembic upgrade head` |
| Redirect loop | Clear cookies for localhost and try again |

## 6. Enable AI (OpenRouter)

Add to `.env.local` at the project root:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Restart `npm run dev:all`, then open **AI Tutor** from the dashboard. A full test checklist is in [TESTING.md](./TESTING.md).

## Required `.env.local` (minimum)

```env
AUTH_SECRET=any-long-random-string-at-least-32-chars
AUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/learnflow
FRONTEND_URL=http://localhost:3000
```

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```
