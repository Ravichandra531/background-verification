# Secure Background Verification Platform (VerifyBGC)

A secure, scalable, and highly aesthetic Background Verification (BGC) Platform designed for recruiters and administrators to submit candidate details, conduct instant identity verification checks (Aadhaar & PAN) via mock/external API endpoints, inspect detailed response logs, manage user roles (RBAC), and generate/print professional verification reports as PDFs.

---

## 🚀 Key Features

1. **🔒 Secure Authentication Module**: JWT-based login and registration system with strong password policy enforcement (uppercase, lowercase, digits, and special characters) and encryption-grade password hashing via `bcrypt`.
2. **👥 Candidate Management (CRUD)**: Complete candidate management interface. Allows adding new candidates, viewing profile directories with search, paginated lists, status filter badges, updating profiles, and deleting candidates.
3. **🛡️ Identity Verification Engine**:
   - **Aadhaar Verification**: Formats and validates 12-digit numeric codes against `/mock-api/aadhaar/verify`, returning match details.
   - **PAN Verification**: Formats and validates letters and digits (e.g. `ABCDE1234F`) against `/mock-api/pan/verify`.
   - **Verification Workflow**: Computes overall status: `VERIFIED`, `FAILED`, or `PARTIAL` based on multiple checks.
4. **👁️ Sensitive Data Protection**: Cryptographic masking for identity numbers (`XXXX-XXXX-1234` / `XXXXX1234X`), emails, and phones on list views. In addition, Aadhaar and PAN cards are fully encrypted in the PostgreSQL database using `AES-256-GCM` to ensure data security.
5. **📊 Premium Analytics Dashboard**: Modern graphs and metrics detailing platform members, vetting cycles, and clearance success rates.
6. **👑 Role-Based Access Control (RBAC)**: An interactive Admin Control panel allowing system admins to promote/demote members, delete candidates globally, and audit system-wide candidate directories and statistic logs.
7. **📄 Professional PDF Report Generation**: Elegant corporate candidate verification certificates complete with overall status, detailed vetting logs, digital seals, and signature placeholders. Integrates perfectly with browser print/PDF drivers for instant downloads.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 16 (React 19, App Router)
- **Styling**: Tailwind CSS v4 + Vanilla CSS transitions & blurs
- **Form Management**: React Hook Form + Zod Schema Validation
- **Network Client**: Axios
- **Icons**: Lucide React

### Backend
- **Framework**: Node.js + Express.js (TypeScript)
- **Database ORM**: Prisma Client
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Express Rate Limiting, CORS configuration, Bcrypt hashing, AES-256-GCM Cryptography

### Database
- **Engine**: PostgreSQL (Local/Remote)

---

## 📁 Repository Structure

```
background-verification/
├── backend/                  # REST API Server
│   ├── prisma/               # Database schemas
│   ├── src/
│   │   ├── config/           # DB Client & JWT setups
│   │   ├── controllers/      # Route handler logic (Auth, Candidates, Verification, Reports)
│   │   ├── middleware/       # Auth validation, RBAC, Rate-limiters
│   │   ├── routes/           # REST endpoints
│   │   ├── types/            # Express request & custom type definitions
│   │   └── index.ts          # Server entry file
│   ├── .env                  # Port, DB credentials, encryption keys
│   └── package.json
│
├── frontend/                 # Next.js App Router Client
│   ├── src/
│   │   ├── app/              # Routes & layouts
│   │   ├── components/       # Interface units (Dashboard, Candidates, Reports, Admin)
│   │   ├── services/         # Axios API connection
│   │   └── types/            # TypeScript type schemas
│   ├── .env.local            # Base API URL endpoint
│   └── package.json
└── README.md                 # Project Blueprint and User Manual
```

---

## ⚙️ Environment Configuration

### Backend Environment Variables (`backend/.env`)

```ini
DATABASE_URL="postgresql://user:password@localhost:5432/background_verification?schema=public"
JWT_SECRET="super-secret-jwt-key-for-background-verification-platform-2026"
JWT_EXPIRES_IN="24h"
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
PORT=3000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"
```

### Frontend Environment Variables (`frontend/.env.local`)

```ini
NEXT_PUBLIC_API_URL=http://localhost:3000
PORT=5173
```

---

## 🐳 Docker (all services)

```bash
cp .env.docker.example .env
docker compose up --build
```

- Frontend: http://localhost:5173  
- API: http://localhost:3000  
- Health: http://localhost:3000/health · Readiness: http://localhost:3000/ready  

See [docs/OPS.md](docs/OPS.md) for CI/CD, logging, and monitoring details.

---

## 🚀 Setup & Execution Guide

Ensure you have **Node.js** and a local **PostgreSQL** instance running.

### 1. Database Initialization
Verify that your PostgreSQL service is running. Connect to your shell and run:
```bash
createdb background_verification
```

### 2. Backend Installation & Start
Navigate to the backend directory, configure `.env` variables, execute database synchronization, and run the hot-reloading development server:
```bash
cd backend
npm install
npx prisma db push
npm run dev
```
The server will start on **`http://localhost:3000`**.

### 3. Frontend Installation & Start
Navigate to the frontend directory, configure `.env.local` variables, install dependencies, and launch the dev environment:
```bash
cd ../frontend
npm install
npm run dev
```
The frontend will start on **`http://localhost:5173`**.

---

## 📡 REST API Summary

### Authentication APIs
- `POST /api/auth/register` — Create a new administrative partner or recruiter user.
- `POST /api/auth/login` — Sign in and retrieve a secure Bearer token.

### Candidate Management APIs
- `GET /api/candidates` — Fetch candidates matching user ownership, supports search, pagination, and status filters.
- `POST /api/candidates` — Register a candidate, encrypting Aadhaar/PAN fields.
- `GET /api/candidates/:id` — Retrieve comprehensive candidate records and individual history log events.
- `PUT /api/candidates/:id` — Modify profile details.
- `DELETE /api/candidates/:id` — Remove candidate profile and cascades all dependent verification tables.

### Identity Verification APIs
- `POST /api/verifications/:id/start` — Starts check (`aadhaar`, `pan`, or `all`). Calls mock engine, calculates overall status (`verified`, `partial`, `failed`), and updates Candidate status.
- `GET /api/verifications/:id/status` — Returns individual verification status and message logs.
- `POST /mock-api/aadhaar/verify` — Validates format and checks 12-digit Aadhaar.
- `POST /mock-api/pan/verify` — Validates format and checks alphanumeric PAN.

### Report Generation APIs
- `GET /api/reports/:id` — Downloads verification reports including candidate information and masking.

### Role-Based Access (Admin Only) APIs
- `GET /api/admin/stats` — Audits users, global candidates, and completed verifications count.
- `GET /api/admin/users` — Lists all registered organizations and platform members.
- `GET /api/admin/candidates` — Global candidate directory across all recruiter platforms.
- `PATCH /api/admin/users/:id/role` — Toggles member authorization roles between `user` and `admin`.
- `DELETE /api/admin/candidates/:id` — Permadelete candidate directories globally.

---

## 🛡️ Security Implementations

1. **Sensitive Fields Encryption**: To prevent local database intrusion from leaking candidate identity information, Aadhaar and PAN card records are fully encrypted in transit and at rest using AES-256-GCM symmetric encryption.
2. **Double-layer Masking**: Identity numbers are fully masked in API lists and generated PDF reports. Recruiters and Admins only see redacted outputs like `XXXX-XXXX-1234` or `XXXXX1234X`.
3. **Validation & Hashing**: Password hashes are salted and validated via Zod schemas, requiring robust inputs. SQL injections are mitigated globally via Prisma Client queries.
4. **Rate Limiting**: Integrated using `express-rate-limit` on the `/api` routes (5 attempts per 15 minutes on Auth endpoints) to guard against brute-force intrusion.
