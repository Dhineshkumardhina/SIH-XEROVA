# SECURITY ARCHITECTURE — RAILOPT AI

## 1. Security Overview

**RAILOPT AI** implements defense-in-depth security architecture tailored for critical transportation infrastructure decision systems. 

Security controls protect API endpoints, data persistence, user session tokens, role-based governance, and action auditing.

```
+------------------------------------------------------------------------+
|                          SECURITY ARCHITECTURE                         |
+------------------------------------------------------------------------+
    │                                                                  │
    ▼                                                                  ▼
[Authentication & Tokens]                                   [Role Governance]
 • JWT HS256 Access Tokens (60m)                             • 7 Hierarchical RBAC Roles
 • Refresh Tokens (7 days)                                   • Granular Permission Matrix
 • Password Hashing (Passlib / Argon2)                       • Role Protection Guards
    │                                                                  │
    └──────────────────────────────┬───────────────────────────────────┘
                                   │
                                   ▼
                   [Application & Audit Defenses]
                    • Security Headers (X-Frame-Options, etc.)
                    • Pydantic v2 Input Validation
                    • CORS Origin Enforcement
                    • Tamper-Evident Audit Token Register
```

---

## 2. Authentication & Cryptography

### 2.1 JWT Token Architecture
- **Access Tokens**: Encoded via `jose.jwt` using HS256 algorithm with a minimum 256-bit secret key (`JWT_SECRET`). Expiration set to 60 minutes (`ACCESS_TOKEN_EXPIRE_MINUTES`).
- **Refresh Tokens**: Signed tokens with 7-day expiration (`REFRESH_TOKEN_EXPIRE_DAYS`), permitting seamless token refresh via `POST /api/v1/auth/refresh` without requiring password re-entry.
- **Payload Claims**:
  ```json
  {
    "sub": "user_id_guid",
    "username": "control",
    "roles": ["CONTROL_OFFICER"],
    "exp": 1756652400
  }
  ```

### 2.2 Password Hashing
- **Algorithm**: `passlib.context.CryptContext` utilizing **Argon2id** (with fallback support for `bcrypt`).
- **Policy**: Salted, multi-round hashing preventing rainbow table lookup and dictionary attacks. Plaintext passwords are never logged or stored.

---

## 3. Web & Network Security Controls

### 3.1 Input Validation & Schema Sanitization
- **Pydantic v2**: All API request bodies, query parameters, and path variables are validated against strict Pydantic schemas (`app/schemas/`).
- **Type Coercion & Injection Protection**: Rejects invalid payloads, preventing SQL injection and script injection attacks.

### 3.2 Security Headers Middleware
FastAPI middleware injects security headers into every HTTP response:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### 3.3 CORS Configuration
- Enforces strict origin filtering via `CORSMiddleware`.
- Standard development origins (`http://localhost:5173`, `http://localhost:3000`) and production division domain boundaries configured in `settings.CORS_ORIGINS`.

---

## 4. Audit Trail & Governance Compliance

### 4.1 Tamper-Evident Action Audit Trail
- Every critical operational action (e.g. block plan approval, task priority edit, system reset) generates a structured audit entry in the `audit_logs` database table.
- **Audit Token**: Includes a unique token (`AUD-XXXXXX`), timestamp, initiating user ID, user role, client IP address, and payload snapshot.

### 4.2 Secrets Management
- Sensitive parameters (`JWT_SECRET`, `DATABASE_URL`, `CORS_ORIGINS`) are managed via `pydantic-settings` from environment variables (`.env`). Secrets are excluded from version control (`.gitignore`).
