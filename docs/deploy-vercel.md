# Vercel Deploy

This deploys both the frontend (CRA static bundle) and the backend (Express)
to a single Vercel project. The backend runs as a serverless function via
`api/index.js`, which re-exports the configured Express app from
`src/server/server.js`. The frontend is built from `src/client` and served
as static assets.

## One-time setup

### 1. Log in to Vercel (you, interactively)

The CLI auth flow can't run from inside Claude Code's non-TTY shell —
do this in your own terminal:

```bash
npx vercel login
```

Pick the email or GitHub option, click the link, done.

### 2. Link this directory to a Vercel project

From the repo root:

```bash
npx vercel link
```

Pick "Create a new project" the first time. Confirm the project name
(`dormdoc` or whatever). This creates `.vercel/` in the repo (gitignored).

### 3. Set environment variables

In the Vercel dashboard → **Project Settings → Environment Variables**
(or via CLI, see below). Set these for **Production**, **Preview**, and
**Development** as appropriate.

#### Required — server-side

| Variable | Where to get it |
|---|---|
| `SUPABASE_URL` | Supabase dashboard → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → `service_role` secret |
| `SUPABASE_JWT_SECRET` | Same page → JWT Secret |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | The Vercel deployment URL(s), comma-separated. e.g. `https://dormdoc.vercel.app,https://dormdoc-git-main-yourorg.vercel.app` |

#### Required — client-side (CRA reads these at build time)

| Variable | Where to get it |
|---|---|
| `REACT_APP_SUPABASE_URL` | Same as `SUPABASE_URL` |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase dashboard → API → `anon` public |

#### Optional

| Variable | Purpose |
|---|---|
| `GROQ_API_KEY` | Enables `routes/chat.js` Groq tool-calling |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USER` / `EMAIL_PASS` | SMTP for leave-request notifications (server falls back to a best-effort skip if missing) |
| `SUPABASE_ACCESS_TOKEN` | Only needed if you run `supabase` CLI from CI |

CLI shortcut (run once per variable):

```bash
npx vercel env add SUPABASE_URL production
# prompts for the value, then repeats for each env (production / preview / development)
```

### 4. Tell Supabase about the new origin

Supabase Auth has its own redirect-URL allow-list, independent of CORS.
In the Supabase dashboard → **Authentication → URL Configuration**:

- Site URL: your prod Vercel URL (e.g. `https://dormdoc.vercel.app`)
- Additional Redirect URLs: `https://dormdoc.vercel.app/**`, plus the
  preview pattern `https://dormdoc-*-yourorg.vercel.app/**`, plus
  `http://localhost:3000/**` for dev.

## Deploying

### Preview (any branch push)

```bash
git push origin <branch>
```

Vercel auto-builds and posts a preview URL on the PR.

### Production

Merging to `main` triggers a production deploy. Or force one with:

```bash
npx vercel --prod
```

## How requests route

```
Request URL                       Where it lands
─────────────────────────────────────────────────────────────────────
GET  /                            src/client/build/index.html (static)
GET  /static/js/main.abc.js       src/client/build/static/...
GET  /api/health                  api/index.js → Express → /api/health
POST /api/student/book-appointment  api/index.js → Express → /api/student
GET  /api/prescriptions/:id/file-url  api/index.js → Express → /api/prescriptions
```

The `vercel.json` rewrite `"/api/(.*)" → "/api/index"` routes every
`/api/*` URL to the single serverless function. Express's own router
sees the original URL on `req.url` and dispatches normally.

## Limits to know about

- **Function maxDuration: 10s** (Hobby plan). Long-running endpoints
  (e.g. CSV imports, exports) may need bumping to 60s on Pro. Set in
  `vercel.json` → `functions["api/index.js"].maxDuration`.
- **Cold starts:** first request after idle time takes ~1–3s. Negligible
  for an internal campus app; consider Pro's "always-on" if you care.
- **No WebSocket support.** Already fine — Phase 4 dropped socket.io;
  realtime goes client → Supabase directly.
- **No persistent disk.** Already fine — Phase 5 moved uploads to
  Supabase Storage.

## Rollback

If a deploy breaks production:

1. Vercel dashboard → **Deployments** → pick the previous successful
   deployment → **Promote to Production**. Reverts in seconds, no Git
   work needed.
2. Or `npx vercel rollback <deployment-url>`.
3. Then `git revert <bad-commit>` and push to keep history honest.

Schema rollbacks (Supabase) are independent — a bad migration needs
either a forward-fix migration or a manual restore from a Supabase
PITR backup (Pro plan).
