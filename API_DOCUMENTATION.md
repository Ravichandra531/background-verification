# BGVAPI Documentation

**Background Verification Platform — REST API Reference**

**Production:** https://background-verification-aaou.onrender.com

**Generated:** 21 May 2026

---

## Contents

1. [Conventions](#1-conventions)
2. [Authentication](#2-authentication)
3. [Rate Limiting](#3-rate-limiting)
4. [Errors](#4-errors)
5. [Endpoints](#5-endpoints)
   - 5.1 [Auth](#51-auth)
   - 5.2 [Candidates](#52-candidates)
   - 5.3 [Verification](#53-verification)
   - 5.4 [Reports](#54-reports)
   - 5.5 [Mock Providers](#55-mock-providers)

---

## 1. Conventions

### Request

- All request bodies are JSON: `Content-Type: application/json`
- Protected endpoints require an `Authorization: Bearer <JWT>` header
- Query parameters are URL-encoded

### Response — success shape

```json
{
  "success": true,
  "message": "Optional human-readable message",
  "data": { /* payload */ }
}
```

### Response — error shape

```json
{
  "success": false,
  "message": "Human-readable error",
  "errors": [
    { "path": "fieldName", "message": "What was wrong with this field" }
  ]
}
```

The `errors` array is only present for **422 Validation Failed** responses (Zod errors).

### Sensitive data

Aadhaar and PAN are never returned raw. They are always masked:

- **aadhaarMasked:** `"XXXX-XXXX-1234"` — last 4 digits visible
- **panMasked:** `"XXXXX234F"` — middle 4 chars visible
- **Passwords** are bcrypt-hashed at rest and never returned.

---

## 2. Authentication

The API uses **JWT bearer tokens**. Tokens are issued on register or login.

### Obtaining a token

```bash
curl -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}'
```

The `data.token` value is the JWT.

### Using a token

Add this header to every protected request:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token lifetime

- **Default:** 7 days (configurable via `JWT_EXPIRES_IN`)
- Expired or invalid tokens return **401 Unauthorized**
- The frontend automatically clears the stored token and redirects to `/login` on 401

---

## 3. Rate Limiting

| Scope | Limit | Window |
|-------|-------|--------|
| `/api/auth/*` | 10 requests | per IP per 15 min |
| `/api/verifications/*` | 30 requests | per IP per 1 min |
| All `/api/*` (global) | 200 requests | per IP per 1 min |

Hitting a limit returns **HTTP 429** with:

```json
{
  "success": false,
  "message": "Too many authentication attempts from this IP. Please try again in 15 minutes."
}
```

Standard rate-limit headers (`RateLimit-*`) are included in every response.

---

## 4. Errors

| Status | When | Body |
|--------|------|------|
| 400 | Bad request (custom AppError) | `{ success: false, message }` |
| 401 | Missing / invalid / expired token | `{ success: false, message }` |
| 404 | Resource not found | `{ success: false, message }` |
| 409 | Conflict (e.g. email already registered) | `{ success: false, message }` |
| 422 | Validation failed (Zod) | `{ success: false, message, errors[] }` |
| 429 | Rate-limit exceeded | `{ success: false, message }` |
| 500 | Unhandled server error | `{ success: false, message: "Internal server error" }` |

---

## 5. Endpoints

### 5.1 Auth

#### **POST** `/api/auth/register`

**Public.** Create a new user account.

**Request body:**

```json
{
  "name": "Admin User",
  "email": "admin@test.com",
  "password": "password123"
}
```

**Validation:**

| Field | Rule |
|-------|------|
| name | 2–100 characters |
| email | valid email, must be unique |
| password | minimum 8 characters, must contain uppercase, number, special char |

**Response 201:**

```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "6a0e5087a3a46ff1851f89aa",
      "name": "Admin User",
      "email": "admin@test.com",
      "createdAt": "2026-05-21T00:24:23.123Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errors:**
- 409 — email already registered
- 422 — validation failure

---

#### **POST** `/api/auth/login`

**Public.** Authenticate and receive a token.

**Request body:**

```json
{
  "email": "admin@test.com",
  "password": "password123"
}
```

**Response 200** — same shape as register.

**Errors:**
- 401 — invalid email or password
- 422 — missing fields

---

### 5.2 Candidates

All candidate endpoints are **protected**. Candidates are scoped to the authenticated user — you can only see / modify your own.

#### **GET** `/api/candidates`

List candidates with optional search, status filter, and pagination.

**Query parameters:**

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| page | int | 1 | 1-indexed |
| limit | int | 10 | max 100 |
| search | string | — | matches name, email, or phone (case-insensitive) |
| status | enum | — | PENDING / VERIFIED / FAILED / PARTIAL |

**Example:**

```
GET /api/candidates?page=1&limit=10&search=john&status=VERIFIED
```

**Response 200:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "6a0e51cdffce856252fa99ce",
        "fullName": "John Doe",
        "email": "john@test.com",
        "phone": "9876543210",
        "aadhaarMasked": "XXXX-XXXX-1234",
        "panMasked": "XXXXX234F",
        "dob": "1995-06-15T00:00:00.000Z",
        "address": "42 Some Street, Bengaluru",
        "status": "VERIFIED",
        "createdAt": "2026-05-21T00:29:01.066Z",
        "updatedAt": "2026-05-21T00:35:21.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

#### **POST** `/api/candidates`

Create a single candidate.

**Request body:**

```json
{
  "fullName": "John Doe",
  "email": "john@test.com",
  "phone": "9876543210",
  "aadhaarNumber": "123412341234",
  "panNumber": "ABCDE1234F",
  "dob": "1995-06-15",
  "address": "42 Some Street, Bengaluru"
}
```

**Validation rules:**

| Field | Rule |
|-------|------|
| fullName | 2–100 characters |
| email | valid email |
| phone | 10 digits |
| aadhaarNumber | 12 digits |
| panNumber | format: ABCDE1234F (auto-uppercased) |
| dob | parseable date (YYYY-MM-DD recommended) |
| address | 10–500 characters |

**Response 201:** returns the created candidate (with masked aadhaar/PAN, status PENDING).

---

#### **GET** `/api/candidates/:id`

Fetch a candidate with full verification logs (newest first).

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": "6a0e51cdffce856252fa99ce",
    "fullName": "John Doe",
    "email": "john@test.com",
    "phone": "9876543210",
    "aadhaarMasked": "XXXX-XXXX-1234",
    "panMasked": "XXXXX234F",
    "dob": "1995-06-15T00:00:00.000Z",
    "address": "42 Some Street, Bengaluru",
    "status": "VERIFIED",
    "createdAt": "2026-05-21T00:29:01.066Z",
    "updatedAt": "2026-05-21T00:35:21.000Z",
    "verificationLogs": [
      {
        "id": "6a0e52...",
        "verificationType": "aadhaar",
        "verificationStatus": "completed",
        "verifiedAt": "2026-05-21T00:30:11.000Z"
      }
    ]
  }
}
```

**Errors:**
- 404 — candidate not found (or owned by another user)

---

#### **PUT** `/api/candidates/:id`

Update a candidate. All body fields are optional — only what you send is changed.

**Request body (any subset):**

```json
{
  "fullName": "John Doe Updated",
  "phone": "9876543299",
  "address": "New address"
}
```

**Response 200:** returns updated candidate object.

---

#### **DELETE** `/api/candidates/:id`

Delete a candidate and all its verification logs (cascade).

**Response 200:**

```json
{
  "success": true,
  "message": "Candidate deleted",
  "data": { "id": "6a0e51cdffce856252fa99ce" }
}
```

---

### 5.3 Verification

#### **POST** `/api/verifications/:id/start`

Run Aadhaar and PAN verification on a candidate.

**Request body:**

```json
{
  "verificationType": "all"
}
```

Valid values: `"aadhaar"`, `"pan"`, `"all"`

The endpoint:
- Calls the configured Aadhaar provider (AADHAAR_API_URL)
- Calls the configured PAN provider (PAN_API_URL)
- Stores both as verification_logs rows
- Computes overall status: both VERIFIED → VERIFIED; both FAILED → FAILED; mixed → PARTIAL
- Updates candidate.status

**Response 200:**

```json
{
  "success": true,
  "message": "Verification completed",
  "data": {
    "candidateId": "6a0e51cdffce856252fa99ce",
    "overallStatus": "VERIFIED",
    "aadhaar": {
      "status": "VERIFIED",
      "response": {
        "status": "verified",
        "nameMatch": true,
        "dobMatch": true,
        "message": "Aadhaar verified successfully"
      }
    },
    "pan": {
      "status": "VERIFIED",
      "response": {
        "status": "verified",
        "panStatus": "active",
        "message": "PAN verified successfully"
      }
    }
  }
}
```

**Errors:**
- 404 — candidate not found
- 429 — verification rate limit (30/min per IP)

---

### 5.4 Reports

#### **GET** `/api/reports/:id`

Generate and return JSON verification report for a candidate.

**Response 200:**

```json
{
  "success": true,
  "message": "Report generated successfully",
  "data": {
    "report": {
      "candidateInfo": {
        "candidateId": "6a0e51cdffce856252fa99ce",
        "fullName": "John Doe",
        "email": "john@test.com",
        "phone": "9876543210",
        "aadhaarNumber": "XXXX-XXXX-1234",
        "panNumber": "XXXXX234F",
        "dob": "1995-06-15",
        "address": "42 Some Street, Bengaluru"
      },
      "verificationStatus": "VERIFIED",
      "verifications": [
        {
          "type": "aadhaar",
          "status": "completed",
          "verifiedAt": "2026-05-21T00:30:11.000Z"
        }
      ],
      "generatedAt": "2026-05-21T00:35:21.000Z",
      "verifiedBy": "Admin User",
      "verifiedByEmail": "admin@test.com"
    }
  }
}
```

**Errors:**
- 404 — candidate not found

---

#### **GET** `/api/reports/:id/pdf`

Generate and stream the PDF verification report for a candidate.

**Response headers:**

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="verification-report-{id}-{timestamp}.pdf"
Content-Length: <bytes>
```

**Response body:** raw PDF bytes

**Errors:**
- 404 — candidate not found

---

### 5.5 Mock Providers

These routes simulate external Aadhaar / PAN verification providers. They are **public** (no auth) so any backend can call them, but normally they are only invoked by the verification service.

**Verification rule:** input matches the regex → "verified", else "failed".

In production, set `AADHAAR_API_URL` and `PAN_API_URL` to your licensed provider's endpoints (Karza / Surepass / IDfy / etc.) and these mock routes can be removed.

---

#### **POST** `/mock-api/aadhaar/verify`

**Request body:**

```json
{
  "aadhaarNumber": "123412341234"
}
```

**Response (verified)** — when input matches `^\d{12}$`:

```json
{
  "status": "verified",
  "nameMatch": true,
  "dobMatch": true,
  "message": "Aadhaar verified successfully"
}
```

**Response (failed)** — anything else:

```json
{
  "status": "failed",
  "nameMatch": false,
  "dobMatch": false,
  "message": "Aadhaar verification failed: invalid format"
}
```

---

#### **POST** `/mock-api/pan/verify`

**Request body:**

```json
{
  "panNumber": "ABCDE1234F"
}
```

**Response (verified)** — when input matches `^[A-Z]{5}[0-9]{4}[A-Z]$`:

```json
{
  "status": "verified",
  "panStatus": "active",
  "message": "PAN verified successfully"
}
```

**Response (failed)** — anything else:

```json
{
  "status": "failed",
  "panStatus": "inactive",
  "message": "PAN verification failed: invalid format"
}
```

---

## Appendix

### Environment Variables

Key environment variables for the backend:

- `PORT` — Server port (default: 5000)
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Secret key for JWT signing
- `JWT_EXPIRES_IN` — Token expiration (default: 7d)
- `ENCRYPTION_KEY` — 64-char hex string for AES-256-GCM encryption
- `BCRYPT_SALT` — Salt rounds for password hashing (default: 10)
- `CORS_ORIGIN` — Allowed origins (comma-separated)
- `AADHAAR_API_URL` — Aadhaar verification provider URL
- `PAN_API_URL` — PAN verification provider URL

### Testing

Use the provided test credentials:
- **Email:** admin@test.com
- **Password:** password123

Or register a new account via `/api/auth/register`.

---

**End of Documentation**
