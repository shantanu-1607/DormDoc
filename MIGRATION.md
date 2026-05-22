# DormDoc → Supabase Migration Plan

> **Target:** 5,000 users on Supabase free tier. Email OTP primary, SMS optional (via MSG91) later. Frontend on Vercel, Express backend on Render free tier transitionally, then Edge Functions where it makes sense.

## Migrating from

- **DB:** MongoDB (Mongoose, 14 models)
- **Auth:** Custom JWT + Clerk (dual system — to be consolidated)
- **OTP:** Email-only (model has `email`, no phone) — clean handoff to Supabase Auth
- **Realtime:** Socket.io
- **Uploads:** Multer (3 routes: prescriptions, student, inventory)
- **Hosting:** Netlify (frontend) + Heroku/Render (backend) per config
- **Roles:** student · admin · doctor · HOD · parent · dispensary_staff · faculty (7)

## Working branch

All migration work lives on `feat/supabase-migration`. `main` stays untouched until cutover.

---

## Phase 0 — Foundation *(1–2 days)*

### Block 0.1: Accounts & projects
- [ ] Create Supabase account at supabase.com
- [ ] Create project `dormdoc-staging` (region `ap-south-1` Mumbai)
- [ ] Save anon key, service-role key, JWT secret in `.env.local` (NOT committed)
- [ ] (Optional) Create `dormdoc-prod` for later cutover

### Block 0.2: Local dev environment
- [ ] Install Docker Desktop for Mac
- [ ] `npx supabase init` → scaffolds `supabase/` folder
- [ ] `npx supabase login`
- [ ] `npx supabase link --project-ref <ref>`
- [ ] `npx supabase start` → verify Postgres + Auth + Storage run locally

### Block 0.3: Branch + envs
- [x] Create `feat/supabase-migration` branch
- [ ] Add Supabase env vars to `.env.example`
- [ ] Install `@supabase/supabase-js` in client + server
- [ ] Install Supabase CLI as devDependency (done — v2.101.0)

**Deliverable:** local Supabase running, repo wired, branch ready. No functional change yet.

---

## Phase 1 — Schema Design *(3–5 days)*

### Block 1.1: Map Mongoose → Postgres tables

| Mongoose model | Postgres table | Notes |
|---|---|---|
| User | `profiles` (extends `auth.users`) | Supabase Auth owns `auth.users`; `profiles` 1:1 |
| Student, Faculty, Parent, Doctor, DispensaryStaff | `profiles` + role-specific tables | Separate tables per role for clean RLS |
| OTP | **deleted** | Supabase Auth handles natively |
| Prescription | `prescriptions` | FK → patient, doctor |
| Appointment | `appointments` | FK → student, doctor, slot |
| InventoryItem | `inventory_items` | |
| Ambulance, AmbulanceTrip | `ambulances`, `ambulance_trips` | trips FK → ambulance + driver |
| LeaveDecision | `leave_decisions` | |
| LoginLog | `login_logs` OR Supabase audit | decide later |

### Block 1.2: Define enums + relations
- [ ] `user_role` enum: `student | doctor | hod | admin | parent | dispensary_staff | faculty`
- [ ] `prescription_status` enum
- [ ] `appointment_status` enum
- [ ] FK relationships with explicit `ON DELETE` per table

### Block 1.3: Initial migrations
- [ ] `npx supabase migration new init_schema`
- [ ] Write SQL per logical group (auth/profiles, clinical, inventory, ambulance, logs)
- [ ] Apply locally + sample inserts

### Block 1.4: RLS policy skeleton
- [ ] Enable RLS on every table (default-deny)
- [ ] Write policies per role:
  - Students: own profile + own prescriptions + own appointments
  - Doctors: read all students, write prescriptions
  - HOD: department-scoped reads
  - Admin: full access
- [ ] Document policy decisions in `docs/rls-policies.md`

**Deliverable:** local Supabase has full schema + RLS, no data yet.

---

## Phase 2 — Auth Migration *(2–3 days)*

### Block 2.1: Supabase Auth setup
- [ ] Enable email provider in Supabase dashboard
- [ ] Configure email templates (OTP, magic link, password reset)
- [ ] Set redirect URLs (localhost + Vercel preview + prod)
- [ ] Decide: 6-digit OTP code (matches current UX) vs magic link

### Block 2.2: Replace OTP system
- [ ] Delete `src/server/models/OTP.js`
- [ ] Stash `src/server/utils/sms.js` for future SMS fallback
- [ ] Client: replace OTP calls with `supabase.auth.signInWithOtp({ email })` and `verifyOtp`
- [ ] Update `src/client/src/pages/Auth/*` components

### Block 2.3: Replace Clerk + JWT middleware
- [ ] Server `middleware/auth.js`: validate Supabase JWT
- [ ] Use `supabase.auth.getUser(token)` or verify JWT with `SUPABASE_JWT_SECRET`
- [ ] Delete `routes/clerkAuth.js` + Clerk SDK from client deps
- [ ] Preserve dev-bypass tokens (optional, behind `NODE_ENV=development`)

### Block 2.4: Profile sync trigger
- [ ] Postgres trigger: on `auth.users` insert → create matching `profiles` row with default role
- [ ] Admin assigns proper role + role-specific data via UI later

**Deliverable:** users sign up, receive email OTP, log in via Supabase Auth end-to-end.

---

## Phase 3 — Data Layer Migration *(1–2 weeks)*

> Strategy: keep Express, swap only the DB driver. Mongoose → supabase-js, route-by-route.

### Block 3.1: Add supabase-js to server
- [ ] Create `src/server/db/supabase.js` (service-role client)
- [ ] Helper for user-scoped client (uses caller's JWT)

### Block 3.2: Migrate routes one-by-one (low → high risk)
- [ ] `routes/profile.js`
- [ ] `routes/inventory.js`
- [ ] `routes/prescriptions.js`
- [ ] `routes/student.js`
- [ ] `routes/admin.js`
- [ ] `routes/analytics.js`
- [ ] `routes/hod.js`
- [ ] `routes/ambulance.js` + `ambulance-tracking.js`
- [ ] `routes/qr.js`, `erp.js`, `chat.js`, `chatbot.js`, `ai.js`

Per route:
- Replace Mongoose calls with `supabase.from(...).select/insert/update/delete`
- Update camelCase → snake_case field names
- Run + add tests

### Block 3.3: Direct client → Supabase reads (optional)
- [ ] Identify read-heavy pages that can bypass Express
- [ ] RLS enforces security; lower latency + less Express load

**Deliverable:** all routes use Postgres. Remove Mongoose dependency.

---

## Phase 4 — Realtime Migration *(1–2 days)*

### Block 4.1: Audit Socket.io usage
- [ ] Identify all server-side `io.emit` + client `socket.on`
- [ ] Map each to a Postgres table that can drive realtime

### Block 4.2: Switch to Supabase channels
- [ ] Enable replication on target tables
- [ ] Client subscribes via `supabase.channel().on('postgres_changes', ...)`
- [ ] Remove `socket.io` + `socket.io-client` deps

**Deliverable:** live updates without a custom socket server.

---

## Phase 5 — File Storage Migration *(1–2 days)*

### Block 5.1: Buckets + policies
- [ ] Create `prescriptions`, `inventory-images`, `student-uploads`
- [ ] Bucket-level RLS (students read only own prescriptions, etc.)

### Block 5.2: Replace Multer
- [ ] `prescriptions.js`: signed upload URLs from client
- [ ] `student.js`: same pattern
- [ ] `inventory.js`: same pattern
- [ ] Remove `multer` dep

**Deliverable:** uploads go to Supabase Storage, served via CDN.

---

## Phase 6 — Edge Functions (Optional, Post-Cutover)

Candidate jobs:
- [ ] OTP cleanup cron (replaces `setInterval` in current OTP model)
- [ ] Appointment reminder emails
- [ ] SMS fallback via MSG91 (when needed)
- [ ] Analytics aggregation

`npx supabase functions new <name>` + deploy. 500K invocations/month free.

---

## Phase 7 — Hosting Cutover *(1–2 days)*

### Block 7.1: Frontend → Vercel
- [ ] Connect repo at vercel.com
- [ ] Build: `cd src/client && npm run build`, output `src/client/build`
- [ ] Env vars: `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`

### Block 7.2: Backend Express
- [ ] Keep on Render free tier (cold starts OK for now)
- [ ] Plan progressive move of jobs into Edge Functions

### Block 7.3: DNS + CORS
- [ ] Add new origins to Supabase Auth allowed redirect URLs
- [ ] Update Express CORS

**Deliverable:** new prod URLs live.

---

## Phase 8 — Data Migration + Cutover *(2–3 days)*

### Block 8.1: ETL script
- [ ] Node script: Mongo → Postgres (idempotent upserts)
- [ ] Order: auth.users → profiles → role tables → prescriptions/appointments/inventory

### Block 8.2: Dry run on staging
- [ ] Run ETL into `dormdoc-staging`
- [ ] Spot-check counts + sample records

### Block 8.3: Cutover
- [ ] 30-min maintenance window
- [ ] Freeze writes on Mongo (read-only)
- [ ] Final ETL
- [ ] Flip env / DNS to Supabase
- [ ] Smoke-test critical flows
- [ ] Keep Mongo read-only for 2-week rollback window

### Block 8.4: Rollback plan
- [ ] Documented DNS revert path
- [ ] Mongo data preserved

**Deliverable:** prod traffic on Supabase, Mongo retired.

---

## Phase 9 — Hardening *(ongoing)*

- [ ] Load test with k6/artillery (5K users, 500 concurrent)
- [ ] Index hot tables based on real query patterns
- [ ] Logflare or Supabase log drains
- [ ] Update README, CONTRIBUTING, docs/ for new stack

---

## Timeline estimate

| Pace | Total |
|---|---|
| Part-time (~2h/day) | 5–7 weeks |
| Full-time | 2–3 weeks |

## Risk callouts

1. **RLS complexity with 7 roles** — biggest unknown. Budget buffer for Phase 1.4.
2. **Data migration accuracy** — Phase 8 dry runs are essential.
3. **Ambulance realtime parity** — Phase 4 needs simulated GPS testing.
4. **Clerk → Supabase Auth handoff** — existing Clerk users need migration script OR forced re-signup with grace period.
