# VerifyBGC — Background Verification Platform

Web application for recruiters and administrators to manage candidates, run identity checks (Aadhaar and PAN via mock APIs), review verification logs, and generate printable verification reports. Sensitive identity data is encrypted at rest and masked in the UI.

## Features

- JWT authentication with password policy and role-based access (recruiter / admin)
- Candidate CRUD with search, filters, and pagination
- Aadhaar and PAN verification workflow with overall status (verified, partial, failed)
- Masked display of identity numbers in lists and reports
- Admin panel for users, global candidates, and statistics
- PDF-style verification report (browser print)

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | Next.js, React, Tailwind CSS, React Hook Form, Zod, Axios |
| Backend | Node.js, Express, TypeScript, Prisma |
| Database | PostgreSQL |

## Project structure

```
background-verification/
├── backend/          # API (Express + Prisma)
├── frontend/         # Web UI (Next.js)
├── docker-compose.yml
├── .env.docker.example
└── README.md
```

## Security notice

**Do not commit real secrets.** Keep these files local only and out of version control:

- `backend/.env`
- `frontend/.env.local`
- `.env` (used by Docker Compose)

Copy from the provided `*.example` files and generate your own values. Never paste production credentials, JWT secrets, or encryption keys into the README, issues, or pull requests.

## Environment variables

### Backend (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` and set:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Strong random secret for signing tokens |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `24h`) |
| `ENCRYPTION_KEY` | 64-character hex key (32 bytes) for field encryption |
| `PORT` | API port (default `3000`) |
| `NODE_ENV` | `development` or `production` |
| `CORS_ORIGIN` | Frontend origin allowed by the API |
| `API_BASE_URL` | Base URL the API uses for internal mock verification calls |
| `LOG_LEVEL` | `debug`, `info`, `warn`, or `error` |

### Frontend (`frontend/.env.local`)

Copy `frontend/.env.example` to `frontend/.env.local` and set:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Public URL of the backend API (browser-facing) |
| `PORT` | Dev server port (default `5173`) |

## Run with Docker (recommended for deploy)

**Requirements:** Docker and Docker Compose.

1. Clone the repository and go to the project root.

2. Create a local env file (not committed to git):

   ```bash
   cp .env.docker.example .env
   ```

3. Edit `.env` and set strong, unique values for database password, `JWT_SECRET`, and `ENCRYPTION_KEY`. Set `NEXT_PUBLIC_API_URL` and `CORS_ORIGIN` to the URLs users will actually use in the browser (rebuild the frontend image if you change the API URL).

4. Start all services:

   ```bash
   docker compose up --build -d
   ```

5. Verify:

   - UI: port from `FRONTEND_PORT` in `.env` (default `5173`)
   - API health: `/health` and `/ready` on the backend port (default `3000`)

6. Stop:

   ```bash
   docker compose down
   ```

For production, use HTTPS in front of the stack (reverse proxy), restrict database exposure, and rotate secrets via your hosting provider’s secret store.

## Local development (without Docker)

**Requirements:** Node.js 20+, PostgreSQL.

1. Create a PostgreSQL database for the app.

2. Backend:

   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your local database and generated secrets
   npm install
   npx prisma db push
   npm run dev
   ```

3. Frontend (separate terminal):

   ```bash
   cd frontend
   cp .env.example .env.local
   # Set NEXT_PUBLIC_API_URL to your running API
   npm install
   npm run dev
   ```

## API overview

Authentication: `POST /api/auth/register`, `POST /api/auth/login`

Candidates: `GET|POST /api/candidates`, `GET|PUT|DELETE /api/candidates/:id`

Verification: `POST /api/verifications/:id/start`, `GET /api/verifications/:id/status`

Reports: `GET /api/reports/:id`

Admin (admin role): `/api/admin/*`

Mock verification (development): `POST /mock-api/aadhaar/verify`, `POST /mock-api/pan/verify`

Observability: `GET /health`, `GET /ready`, `GET /metrics`

## CI

GitHub Actions runs backend build, frontend lint/build, and Docker image build on pushes and pull requests to `main` / `master`. The workflow uses `.env.docker.example` only for compose build defaults—not production secrets.

## License

ISC (see package manifests in `backend/` and `frontend/`).
