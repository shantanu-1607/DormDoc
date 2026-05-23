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

## Phase 0 — Foundation *(1–2 days)* — **DONE except final link**

### Block 0.1: Accounts & projects
- [x] Supabase project `Dorm Doc` created (ref **wlkwirmormsspyxgkfqg**, region `ap-northeast-1` Tokyo, free tier)
- [x] anon + service_role + JWT secret saved in `.env.local` (gitignored)
- [ ] Rotate service_role (deferred — was pasted in chat, user accepted risk)
- [ ] (Later) Create `dormdoc-prod` for cutover

### Block 0.2: Local dev environment
- [x] Install Docker engine — used **colima** (lightweight, no admin password) instead of Docker Desktop
- [x] `npx supabase init` → `supabase/config.toml` committed
- [x] `npx supabase login` (user ran interactively)
- [ ] `npx supabase link --project-ref wlkwirmormsspyxgkfqg` ← **next**
- [ ] `npx supabase start` (optional — only needed for local stack work)

### Block 0.3: Branch + envs + MCP
- [x] Branch `feat/supabase-migration` created and pushed
- [x] Supabase env vars in `.env.example`
- [x] `@supabase/supabase-js` installed (root + src/client)
- [x] Supabase CLI v2.101.0 as devDependency
- [x] Supabase MCP server registered (`.mcp.json` committed, activates on Claude Code restart)

**PR open:** [#12 — Phase 0: Supabase migration plan + scaffolding](https://github.com/mightbeanshuu/DormDoc/pull/12)

**Deliverable:** local Supabase running, repo wired, branch ready. No functional change yet.

---

## Phase 1 — Schema Design *(3–5 days)*

### Block 1.1: Map Mongoose → Postgres tables — **DONE**

Full mapping lives in **[`docs/schema-mapping.md`](docs/schema-mapping.md)**. Summary:

| Mongoose model | Postgres table(s) | Notes |
|---|---|---|
| User + Student | `profiles` + `students` (merged) | legacy `User` collection consolidated into `students`; one row per student in both |
| Faculty | `profiles` + `faculty` | HODs = faculty with `profiles.role='hod'` + `hod_department` set |
| Parent | `profiles` + `parents` + `parent_student_links` | M:N parent↔student via link table |
| Doctor + DispensaryStaff | `profiles` + `dispensary_staff` (merged) + `staff_availability` | `Doctor` merged in as `staff_type='medical_officer'`; per-day availability as child table |
| OTP | **deleted** | Supabase Auth handles natively |
| Prescription | `prescriptions` + `prescription_medications` | medications extracted from embedded array |
| Appointment | `appointments` + `leave_requests` | `leaveRequest` subdoc extracted; embedded `prescription` blob removed (use `prescriptions.appointment_id` FK) |
| InventoryItem | `inventory_items` | 1:1 |
| Ambulance | `ambulances` + `ambulance_equipment` + `ambulance_maintenance_issues` | embedded arrays split out; `currentAssignment` removed (derived from trips) |
| AmbulanceTrip | `ambulance_trips` + `ambulance_trip_status_log` | status history extracted, drives realtime feed |
| LeaveDecision | `leave_decisions` | immutable audit (RLS denies UPDATE/DELETE) |
| LoginLog | `login_logs` | `location`/`device` subdocs flattened to columns |

### Block 1.2: Define enums + relations — **DONE**

Full enum list + FK `ON DELETE` matrix in **[`docs/enums-and-fks.md`](docs/enums-and-fks.md)**. 23 enum types, FK policy summary: `CASCADE` for profile/role chain and embedded children; `RESTRICT` for clinical (students→prescriptions/appointments) and dispatch (ambulance→trips) to block accidental data loss; `SET NULL` for "actor" FKs (doctor/driver/decider/updated_by) with denormalized name columns so audit survives staff turnover.

### Block 1.3: Initial migrations — **DONE & APPLIED**

Six migration files in `supabase/migrations/` covering the full schema, in dependency order. RLS is enabled default-deny on every table; policies land in 1.4. All applied via Supabase MCP `apply_migration` on 2026-05-23; local filenames renamed to match server-assigned version stamps so `supabase db push` stays in sync.

- [x] `20260522223631_init_extensions_and_enums.sql` — pgcrypto + citext + 23 enum types + `set_updated_at()` function
- [x] `20260522223709_init_profiles_and_roles.sql` — profiles, students, faculty, parents, dispensary_staff, parent_student_links, staff_availability, medical_history + `auth.users → profiles` trigger
- [x] `20260522223731_init_clinical.sql` — appointments, leave_requests, prescriptions, prescription_medications
- [x] `20260522223735_init_inventory.sql` — inventory_items
- [x] `20260522223757_init_ambulance.sql` — ambulances, equipment, maintenance_issues, trips, status_log
- [x] `20260522223804_init_audit_logs.sql` — leave_decisions, login_logs (append-only, no `updated_at`)
- [x] Validated: `list_tables` shows 20 tables, all RLS-enabled, 0 rows
- [x] Advisors clean except: 20× `rls_enabled_no_policy` (expected — fixed in 1.4); 3 WARNs (`set_updated_at` mutable search_path, `handle_new_user` SECURITY DEFINER exposed via RPC, `citext` in public schema) — all addressed at start of 1.4
- [ ] Sample inserts (deferred to 1.4 alongside RLS policy testing)

### Block 1.4: RLS policy skeleton — **DONE & APPLIED**

Three migrations applied via Supabase MCP on 2026-05-23. Full role × table matrix and trust model in **[`docs/rls-policies.md`](docs/rls-policies.md)**. Security advisors are clean (one residual lint is Supabase-managed `rls_auto_enable`).

- [x] RLS already enabled default-deny in 1.3 — confirmed during 1.4 apply
- [x] `20260522224507_phase14_hardening_and_helpers.sql` — fixes 1.3 warnings (`set_updated_at` search_path, lock down `handle_new_user`, move citext to `extensions`) + 11 RLS helper functions (`is_admin`, `is_doctor`, `is_dispensary_staff`, `is_hod`, `is_faculty`, `is_parent`, `is_student`, `hod_department`, `student_department(uuid)`, `parent_of_student(uuid)`, `current_role_v`)
- [x] `20260522224804_phase14_rls_policies.sql` — full per-role policies for all 20 tables; append-only enforcement on `leave_decisions`, `login_logs`, `ambulance_trip_status_log`; `BEFORE UPDATE` trigger `guard_parents_verification` blocks non-admin writes to `parents.is_verified*`
- [x] `20260522224952_phase14_move_helpers_to_private.sql` — moves helpers + guard trigger fn to `app_private` schema so they're not exposed via PostgREST `/rest/v1/rpc/*`; OIDs preserved so policies/trigger keep working
- [x] `20260522225738_phase14_perf_pass.sql` — adds 9 covering indexes for actor/audit FKs; recreates every policy with `(select auth.uid())` initplan pattern (clears 34× `auth_rls_initplan` WARN at scale)
- [x] `docs/rls-policies.md` published

**Known residual lints (accepted):**
- 1× `rls_auto_enable` SECURITY DEFINER warning — Supabase-managed event trigger function, not ours.
- 1× `multiple_permissive_policies` WARN on `profiles.UPDATE` — by design (self vs. admin split for role-escalation guard).
- N× `unused_index` INFO — expected on empty DB.

**Deliverable:** schema + RLS live on `wlkwirmormsspyxgkfqg`. Empty database, ready for Phase 2 (auth migration).

---

## Phase 2 — Auth Migration *(2–3 days)*

Decision log:
- **OTP delivery:** 6-digit email OTP (matches old UX). Magic link deferred.
- **Email provider:** Supabase default SMTP for dev; configure Resend / Postmark / SES before prod.
- **Onboarding:** post-OTP form collects role-specific fields (`students` row).
- **Existing users:** greenfield — no Mongo/Clerk users to migrate. Forced re-signup acceptable.
- **MSG91 / SMS:** deferred to Phase 2.x via Supabase "Send SMS Hook".

### Block 2.1: Supabase Auth setup *(dashboard, user-driven)*
- [ ] Enable email provider in Supabase dashboard
- [ ] Update "Magic Link" + "Confirm signup" templates to include `{{ .Token }}` (6-digit code, not link)
- [ ] Set redirect URLs (`http://localhost:3000/**`, Vercel preview pattern, prod)
- [x] Decide: 6-digit OTP code (matches current UX) vs magic link → **6-digit code**

### Block 2.2: Replace OTP system → ✅ done
- [x] Delete `src/server/models/OTP.js`
- [x] Stash `src/server/utils/sms.js` for future SMS fallback (kept on disk, unimported)
- [x] Client: `signInWithOtp` / `verifyOtp` wired through new `AuthContext`
- [x] Rewrite `Login.js`, `Register.js`, `ForgotPassword.js`, `Onboarding.js`

### Block 2.3: Replace Clerk + JWT middleware → ✅ done
- [x] Server `middleware/auth.js`: HS256 verify against `SUPABASE_JWT_SECRET`, load profile + role-row via service-role
- [x] Add `src/server/db/supabase.js` (service-role + user-scoped clients)
- [x] Delete `routes/clerkAuth.js` + `@clerk/clerk-react` from client deps
- [x] Preserve dev-bypass tokens (`dev_token` / `hod_dev_token` under `NODE_ENV=development`, stable UUIDs)
- [x] Add `POST /api/onboarding` for first-time role-specific row insert

### Block 2.4: Profile sync trigger → ✅ done (Phase 1.4)
- [x] `on_auth_user_created` on `auth.users` → `handle_new_user()` inserts `profiles` row, `role='student'`
- [ ] First end-to-end signup smoke test (pending Block 2.1 dashboard config)

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
