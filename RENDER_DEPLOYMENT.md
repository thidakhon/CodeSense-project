# CodeSense — Render Deployment

This project deploys as **two Render services**: a Node Web Service for the API and a Static Site for the Vite SPA. All secrets come from environment variables — nothing is hardcoded.

## Option A: Blueprint (recommended)

`render.yaml` is included in the repo.

1. Push your changes to GitHub.
2. In Render, click **New + → Blueprint** and connect the repository.
3. Name the blueprint and click **Apply**.
4. When prompted, set:
   - `OPENROUTER_API_KEY` — your key from https://openrouter.ai/keys
   - `GOOGLE_CLIENT_ID` — optional; only if you want "Continue with Google" to work
   - `VITE_GOOGLE_CLIENT_ID` — optional; must match the backend value above
5. Render creates:
   - `codesense-backend` (Web Service)
   - `codesense-frontend` (Static Site)

`VITE_API_URL` is wired automatically from the backend service URL, and `JWT_SECRET` is generated for you.

## Option B: Manual setup

### 1. Backend — Web Service

| Setting | Value |
| --- | --- |
| Name | `codesense-backend` |
| Region | Oregon (or nearest) |
| Branch | `main` |
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Plan | Free |
| Health Check Path | `/api/health` |

Environment Variables:

```text
NODE_VERSION=22.13.1
PORT=10000
JWT_SECRET=<generate a long random string>
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=<your OpenRouter key>
OPENROUTER_MODEL=nvidia/nemotron-3.5-lightning:free
CLIENT_ORIGIN=*
USE_MOCK=false
USE_FALLBACK_ON_ERROR=true
OPENAI_MAX_RETRIES=3
OPENAI_RETRY_BASE_MS=3000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10
GOOGLE_CLIENT_ID=<optional>
```

> `server.js` binds to `process.env.PORT`, so Render's `PORT=10000` works as-is.

### 2. Frontend — Static Site

| Setting | Value |
| --- | --- |
| Name | `codesense-frontend` |
| Branch | `main` |
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |
| Plan | Free |

Environment Variables:

```text
NODE_VERSION=22.13.1
VITE_API_URL=<your backend URL, e.g. https://codesense-backend.onrender.com>
VITE_GOOGLE_CLIENT_ID=<optional, must match backend GOOGLE_CLIENT_ID>
```

Add a rewrite rule if you use client-side routes (already in `render.yaml`):

```text
Source: /*
Destination: /index.html
```

## Notes

- **Node version:** use Node 22+. `better-sqlite3@13` has no prebuilt binary for older runtimes.
- **Free AI:** `nvidia/nemotron-3.5-lightning:free` costs nothing. Free models are capped at 20 requests/minute and 50 requests/day unless you have purchased credits. If a free model is busy, change `OPENROUTER_MODEL` to another `:free` model.
- **SQLite data:** on the free plan the filesystem is ephemeral, so chat history resets after a restart/redeploy. For durable history, attach a persistent disk (paid) or migrate to Render PostgreSQL.
- **Cold starts:** free services sleep after inactivity; the first request can take 30–60 seconds.
- **CORS:** `CLIENT_ORIGIN=*` allows the static site to call the API. For a stricter setup, set it to your exact frontend URL.
- **Tab branding:** the title switches between `CodeSense — Sign In` and `CodeSense — Workspace`; the favicon is `frontend/public/favicon.svg`.

## Verify after deploy

```bash
curl https://<your-backend-url>/api/health
# {"status":"ok","service":"code-whisperer-backend",...}
```

Then open the frontend URL, sign in (or use **Try live demo**), and send a code question.
