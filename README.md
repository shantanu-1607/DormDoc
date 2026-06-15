<div align="center">

<img src="assets/logo.png" alt="DormDoc" width="140" />

# DormDoc

### **Reimagining campus healthcare for the digital age.**

*A unified, real-time platform that transforms the college dispensary from paper trails into a connected digital practice — for students, doctors, and administrators.*

<br />

[![CI](https://github.com/mightbeanshuu/DormDoc/actions/workflows/ci.yml/badge.svg)](https://github.com/mightbeanshuu/DormDoc/actions)
[![Release](https://img.shields.io/github/v/release/mightbeanshuu/DormDoc?style=flat-square&color=6366f1)](https://github.com/mightbeanshuu/DormDoc/releases)
[![License](https://img.shields.io/github/license/mightbeanshuu/DormDoc?style=flat-square&color=10b981)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Last Commit](https://img.shields.io/github/last-commit/mightbeanshuu/DormDoc?style=flat-square&color=f59e0b)](https://github.com/mightbeanshuu/DormDoc/commits)
[![Issues](https://img.shields.io/github/issues/mightbeanshuu/DormDoc?style=flat-square&color=ef4444)](https://github.com/mightbeanshuu/DormDoc/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)
[![Code Style](https://img.shields.io/badge/code_style-ESLint-4B32C3?style=flat-square&logo=eslint&logoColor=white)](https://eslint.org/)

<br />

<a href="https://skillicons.dev">
  <img src="https://skillicons.dev/icons?i=react,nodejs,express,supabase,postgres,materialui,git,github" alt="Tech Stack" />
</a>

<br /><br />

**[Live Demo](https://dormdoc.netlify.app)** · **[Documentation](docs/)** · **[Report a Bug](https://github.com/mightbeanshuu/DormDoc/issues/new?labels=bug)** · **[Request a Feature](https://github.com/mightbeanshuu/DormDoc/issues/new?labels=enhancement)**

</div>

---

## 📚 Table of Contents

<details>
<summary>Click to expand</summary>

- [Overview](#-overview)
- [Why DormDoc](#-why-dormdoc)
- [Key Features](#-key-features)
- [Tech Stack](#%EF%B8%8F-tech-stack)
- [System Architecture](#%EF%B8%8F-system-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Usage & API](#-usage--api)
- [Configuration](#%EF%B8%8F-configuration)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Roadmap](#%EF%B8%8F-roadmap)
- [Contributing](#-contributing)
- [Security](#-security)
- [License](#-license)
- [Acknowledgements](#-acknowledgements)

</details>

---

## 🔭 Overview

**DormDoc** is a full-stack, production-grade web application engineered to digitise every workflow inside a campus medical centre. From the moment a student scans a QR code at the counter to the moment an administrator audits monthly inventory, the entire patient journey lives inside a single, secure, real-time platform.

The system replaces fragmented paper records, manual queues, and siloed spreadsheets with a unified React + Express + Supabase platform — purpose-built for the scale, reliability, and access-control requirements of an institutional healthcare environment.

> *"A campus clinic should run with the same precision as the hospitals its students may one day work in."*

---

## 💎 Why DormDoc

| Pain Point (Traditional Clinic) | DormDoc Solution |
| :--- | :--- |
| Paper prescriptions get lost | **Digital prescriptions** signed & retrievable anytime |
| Long queues at the dispensary | **QR-code check-in** + slot booking |
| No visibility into emergencies | **One-tap SOS** with live GPS dispatch |
| Inventory stockouts | **Threshold-based alerts** & auto-reorder reports |
| No data for decision-making | **Analytics dashboard** with trend visualisation |
| Manual leave verification | **Linked prescriptions** auto-validate leave requests |
| Disconnected ambulance dispatch | **Live fleet tracking** & queue management |

---

## ⚡ Key Features

<table>
<tr>
<td width="50%" valign="top">

### 👨‍🎓 For Students
- 🆔 **QR-code identity** — instant check-in at the counter
- 📅 **Smart appointment booking** with real-time slot availability
- 💊 **Digital prescriptions** accessible from any device
- 🚨 **Emergency SOS** with one-tap GPS dispatch
- 🤖 **AI medical chatbot** for symptom triage
- 📝 **Medical leave** auto-linked to prescriptions
- 📜 **Personal health history** in one place

</td>
<td width="50%" valign="top">

### 🩺 For Doctors
- 🗂️ **Patient queue management** with priority flags
- ✍️ **E-prescription writer** with drug-interaction hints
- 💬 **Real-time updates** via Supabase Realtime postgres_changes
- 📊 **Appointment dashboard** with daily/weekly views
- 📁 **Patient history lookup** across visits
- 🔔 **Live notifications** for new bookings & SOS

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🛠️ For Administrators
- 📈 **Analytics dashboard** — visits, demographics, trends
- 📦 **Inventory management** with reorder thresholds
- 🚑 **Ambulance fleet** dispatch & queue tracking
- ✅ **Leave-request approval** workflow
- 👥 **User & role management** (RBAC)
- 📤 **Exportable reports** (CSV / PDF)

</td>
<td width="50%" valign="top">

### 🔒 Platform-Wide
- 🔐 **Postgres RLS** — 7 roles × 20 tables, all default-deny
- 🛡️ **Helmet, CORS, rate-limiting** baked in
- ⚡ **Supabase Realtime** for live UX (no custom socket server)
- 📱 **Fully responsive** — mobile-first design
- 🌐 **REST API** with input validation
- 🧪 **Health-check endpoints** for monitoring

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18 · Material-UI · React Query · React Router · Recharts · `@supabase/supabase-js` |
| **Backend** | Node.js (≥18) · Express · `@supabase/supabase-js` (service-role) · `jsonwebtoken` (Supabase JWT verify) |
| **Database** | Supabase Postgres (15+) with Row-Level Security |
| **Auth** | Supabase Auth — email OTP, JWT (HS256) |
| **Realtime** | Supabase Realtime `postgres_changes` over Websockets |
| **Storage** | Supabase Storage (private `prescriptions` bucket, signed URLs) |
| **Security** | Helmet · CORS · express-rate-limit · express-validator |
| **Integrations** | Nodemailer (SMTP) · Groq / OpenAI / Cohere (AI chat) · QRCode |
| **Tooling** | Supabase CLI · ESLint · Husky · lint-staged · Nodemon · Concurrently |
| **CI** | GitHub Actions |

</div>

> See `MIGRATION.md` for the full record of how this stack replaced the original MongoDB / Clerk / Socket.io / Multer one across PRs #12–26.

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Client["🖥️ React Client — src/client"]
        UI[Material-UI Components]
        RQ[React Query Cache]
        CTX[Auth & Realtime Contexts]
        SBC[supabase-js client]
    end

    subgraph Server["⚙️ Express API — src/server"]
        MW[Helmet · CORS · Rate-limit · Supabase JWT verify]
        RT[REST Routes — student / doctor / admin / hod]
        SVC[Service Layer — hodService, analytics services]
        SBA[supabase-js service-role + per-request scoped client]
    end

    subgraph Supabase["🟢 Supabase project"]
        DB[(Postgres + RLS)]
        AUTH[Auth — email OTP]
        RT2[Realtime — postgres_changes]
        STOR[Storage — prescriptions bucket]
    end

    subgraph External["🌐 External Services"]
        AI[AI — Groq / OpenAI / Cohere]
        MAIL[SMTP — Nodemailer]
        QR[QR-Code Generator]
    end

    UI -->|HTTPS / Axios| MW
    SBC -->|Auth + Realtime + Storage| AUTH
    SBC <-->|postgres_changes| RT2
    SBC -->|signed URL| STOR
    CTX --> UI
    RQ --> UI
    MW --> RT
    RT --> SVC
    SVC --> SBA
    SBA -->|PostgREST| DB
    SBA -->|admin API| AUTH
    SBA -->|upload / delete| STOR
    SVC --> AI
    SVC --> MAIL
    SVC --> QR

    style Client fill:#dbeafe,stroke:#3b82f6,color:#1e3a8a
    style Server fill:#dcfce7,stroke:#10b981,color:#064e3b
    style Supabase fill:#d1fae5,stroke:#059669,color:#064e3b
    style External fill:#fef3c7,stroke:#f59e0b,color:#78350f
```

### Request Lifecycle

1. **Client** issues an authenticated request bearing a Supabase JWT.
2. **Middleware stack** applies Helmet, CORS, rate-limiting, and HS256 JWT verification against `SUPABASE_JWT_SECRET`; loads the caller's profile + role row and attaches a `req.sb` Supabase client (user-scoped for real users, service-role for dev tokens).
3. **Route handler** delegates to a controller / service, which validates inputs.
4. **Service layer** issues Supabase queries against Postgres, Storage, or the Auth admin API.
5. **RLS in Postgres** enforces row-level access on every read/write.
6. **Live updates** reach the client directly via the Supabase Realtime channel (no server roundtrip needed); RLS scopes which clients see which events.

---

## 📁 Project Structure

```
DormDoc/
├── assets/                 # Static assets (logo, branding)
├── docs/                   # Extended documentation
├── scripts/                # Utility scripts (incl. mongo-to-supabase ETL)
├── supabase/               # Supabase project config
│   ├── config.toml
│   ├── migrations/         # SQL migrations (extensions, schema, RLS, storage, realtime)
│   └── tests/              # pgTAP RLS test suite
├── src/
│   ├── client/             # React frontend
│   │   └── src/
│   │       ├── components/
│   │       ├── contexts/   # AuthContext, RealtimeContext, DevBypassContext
│   │       ├── lib/        # supabase client export
│   │       ├── pages/
│   │       └── services/
│   └── server/             # Express backend
│       ├── controllers/
│       ├── db/             # supabase.js + storage.js helpers
│       ├── middleware/     # authenticateToken, requireRole, scopeToDepartment
│       ├── routes/         # one file per resource
│       ├── services/       # hodService, analytics services
│       └── server.js
├── .env.example
└── package.json
```

> No `src/server/models/` — Mongoose was removed at the end of Phase 3 (PR #23). The schema is the Postgres tables, defined in `supabase/migrations/`.

---

## 🚀 Getting Started

### Prerequisites

| Dependency | Minimum | Notes |
| :--- | :---: | :--- |
| [Node.js](https://nodejs.org/) | **18.0** | LTS recommended |
| npm | **9.0** | Bundled with Node.js |
| Supabase project | — | Free tier is enough. Note the project ref, URL, anon key, service-role key, and JWT secret. |
| Git | **2.30** | — |

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/mightbeanshuu/DormDoc.git
cd DormDoc

# 2. Install root + client dependencies
npm install
npm run install-client

# 3. Create your environment files
cp .env.example .env
#    Then create .env.local (gitignored) with the secrets:
#      SUPABASE_URL=https://<ref>.supabase.co
#      SUPABASE_SERVICE_ROLE_KEY=...
#      SUPABASE_JWT_SECRET=...           # from Project Settings → API → JWT
#      SUPABASE_ACCESS_TOKEN=...         # personal access token, for supabase CLI
#    And src/client/.env.development.local with:
#      REACT_APP_SUPABASE_URL=https://<ref>.supabase.co
#      REACT_APP_SUPABASE_ANON_KEY=...

# 4. Push the schema + RLS policies + Storage buckets + Realtime publication
npx supabase link --project-ref <your-ref>
npx supabase db push

# 5. Launch the full stack in dev mode
npm run dev
```

The dev server boots:
- ⚛️  **React client** → http://localhost:3000
- 🔌 **Express API** → http://localhost:5000

In `NODE_ENV=development`, if you need to test without real Supabase Auth, you can opt into a development bypass by setting `DEV_AUTH_BYPASS=true` in your `.env`. When enabled, you can provide a valid user UUID directly as the `Bearer` token to act as that user. Backed by real seeded `auth.users` rows so policy-respecting queries still work — see `supabase/migrations/` and the memory notes for the seed SQL.

---

## 💡 Usage & API

### Health check

```bash
curl http://localhost:5000/api/health
```

```json
{
  "status": "OK",
  "timestamp": "2026-05-21T00:00:00.000Z",
  "uptime": 123.456
}
```

### Book an appointment (student)

```bash
curl -X POST http://localhost:5000/api/student/book-appointment \
  -H "Authorization: Bearer 00000000-0000-0000-0000-000000000001" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "00000000-0000-0000-0000-000000000003",
    "appointmentDate": "2026-05-25",
    "appointmentTime": "10:00",
    "symptoms": "Routine check-up"
  }'
```

```json
{
  "message": "Appointment booked successfully",
  "appointment": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "status": "scheduled",
    "appointment_date": "2026-05-25"
  }
}
```

### Trigger an emergency SOS

```bash
curl -X POST http://localhost:5000/api/student/sos \
  -H "Authorization: Bearer 00000000-0000-0000-0000-000000000001" \
  -H "Content-Type: application/json" \
  -d '{ "symptoms": "Severe chest pain", "location": { "address": "Hostel 3" } }'
```

---

## ⚙️ Configuration

Runtime configuration is split across two files. `.env` holds committed defaults; `.env.local` holds secrets and overrides (gitignored).

### Server (`.env` + `.env.local`)

| Variable | Required | Default | Purpose |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` |  | `development` | Runtime environment |
| `PORT` |  | `5000` | Express server port |
| `SUPABASE_URL` | ✅ | — | `https://<ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | — | Service-role key (bypasses RLS — server only) |
| `SUPABASE_JWT_SECRET` | ✅ | — | HS256 secret used to verify incoming JWTs |
| `SUPABASE_ACCESS_TOKEN` |  | — | Personal access token, for `supabase` CLI from non-TTY shells |
| `CLIENT_URL` |  | `http://localhost:3000` | Comma-separated allow-list of CORS origins |
| `GROQ_API_KEY` |  | — | Groq API key (used by `routes/chat.js`) |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USER` / `EMAIL_PASS` |  | — | SMTP for leave-request notifications |
| `MONGO_URI` |  | — | Only used by `scripts/mongo-to-supabase-etl.js` during cutover |

### Client (`src/client/.env.development.local`)

| Variable | Required | Purpose |
| :--- | :---: | :--- |
| `REACT_APP_SUPABASE_URL` | ✅ | Same as server `SUPABASE_URL` |
| `REACT_APP_SUPABASE_ANON_KEY` | ✅ | Anon key (RLS-respecting) |
| `REACT_APP_SERVER_URL` |  | Override the API base URL (default `http://localhost:5001`) |

> ⚠️  **Never commit `.env.local` or `.env.development.local`.** Both are git-ignored.

---

## 🧪 Testing

```bash
# Run the full test suite
npm test

# Lint the entire codebase
npm run lint

# Format with Prettier (if configured)
npm run format
```

Test coverage reports are generated under `coverage/` and uploaded by CI on every push.

---

## 📦 Deployment

The Supabase migration is **code-complete** (see `MIGRATION.md`). Deployment artifacts:

- **Database / Auth / Storage / Realtime:** managed Supabase project (free tier targets 5K users). Schema lives in `supabase/migrations/` — `supabase db push` is idempotent.
- **Application:** Node Express server + CRA static bundle. Intended target is **Railway**; the deploy runbook lands in a future PR alongside the cutover.
- **Data cutover from a previous Mongo instance (if applicable):** run `node scripts/mongo-to-supabase-etl.js --dry-run` first, populate `USER_ID_MAP` with the Mongo → Supabase auth-id mapping, then a real run during the maintenance window.

For a local production build:

```bash
npm run build && npm start
```

---

## 🗺️ Roadmap

- [x] Core React + Express scaffolding & role-based access
- [x] Appointment booking, prescriptions, ambulance dispatch, SOS
- [x] Analytics dashboard & inventory module
- [x] AI chatbot integration (Groq tool-calling)
- [x] **Supabase migration** — Postgres + Auth + Realtime + Storage (Phases 0–5, 8-ETL)
- [ ] Railway deploy + cutover runbook (Phase 7 + 8.2–8.4)
- [ ] Edge Function features: appointment reminders, MSG91 SMS, analytics aggregation (Phase 6)
- [ ] pgTAP RLS coverage expansion + load tests (Phase 9)
- [ ] Custom SMTP (Resend / Postmark / SES) — default Supabase only emails dashboard members
- [ ] Telemedicine video consultations (WebRTC)
- [ ] React Native mobile applications

See the [open issues](https://github.com/mightbeanshuu/DormDoc/issues) for a live list.

---

## 🤝 Contributing

Contributions are what make open source thrive — every bug fix, feature, doc improvement, or suggestion is welcomed and appreciated.

1. **Fork** the project
2. **Create** your feature branch (`git checkout -b feat/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to your branch (`git push origin feat/amazing-feature`)
5. **Open** a Pull Request

Please review the [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before opening a PR.

---

## 🛡️ Security

If you discover a security vulnerability, please **do not** open a public issue. Instead, follow the disclosure process outlined in [`SECURITY.md`](SECURITY.md). Reports are triaged within 48 hours.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for full text.

```
Copyright (c) 2026 DormDoc Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## 🙏 Acknowledgements

Standing on the shoulders of giants — sincere thanks to the maintainers of:

<div align="center">

[React](https://react.dev/) · [Express](https://expressjs.com/) · [Supabase](https://supabase.com/) · [PostgreSQL](https://www.postgresql.org/) · [Material-UI](https://mui.com/) · [Recharts](https://recharts.org/) · [Helmet](https://helmetjs.github.io/) · [Groq](https://groq.com/)

And to every contributor, tester, and end-user whose feedback shaped this platform.

</div>

---

<div align="center">

### ⭐ If this project helped you, consider giving it a star — it keeps the lights on.

<sub>Built with ❤️  and a lot of coffee.</sub>

</div>
