# Security Policy — RAILOPT AI

## Security Architecture Overview

RAILOPT AI is designed with defense-in-depth security principles across every tier of the application:
1. **Authentication**: JWT access tokens with short expiry (15m), secure SHA-256 hashed refresh tokens (7d), single-use rotation, and automatic account lockout.
2. **Authorization**: Granular server-side Role-Based Access Control (RBAC) enforced via FastAPI dependency injection.
3. **Database Security**: SQLAlchemy ORM with parameter-bound queries preventing SQL injection; internal network isolation.
4. **Transport & Headers**: Security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`) and origin-restricted CORS.
5. **Compute Protection**: Token-bucket rate limiting preventing resource exhaustion on AI and optimization solvers.

---

## Environment Variables & Configuration

Refer to [`.env.example`](.env.example) for the full configuration specification.

Key security environment variables:
- `JWT_SECRET`: High-entropy 256-bit secret key used to sign access tokens. **Must be overridden in production.**
- `DATABASE_URL`: PostgreSQL connection string. Must use strong passwords in non-development environments.
- `CORS_ORIGINS`: JSON array or comma-separated list of allowed origins. Wildcard `*` is strictly prohibited when credentials are enabled.
- `DEMO_MODE`: Set to `false` in production to disable sample demo shortcuts.

---

## Reporting a Vulnerability

If you discover a security vulnerability within RAILOPT AI:
1. **Do not create a public GitHub issue.**
2. Send a detailed report to the security team at `security@railopt.gov.in` (or the designated repository administrators).
3. Include:
   - Description of the vulnerability and attack vector
   - Steps to reproduce or proof-of-concept payload
   - Affected components / endpoints
   - Potential impact assessment

The engineering team will acknowledge receipt within 24 hours and provide regular status updates until the issue is resolved and patched.

---

## Development & Production Hardening Checklist

- [x] Run automated security test suite: `pytest tests/security/ -v`
- [x] Run frontend test suite: `npm test -- --run`
- [x] Ensure `.env` is listed in `.gitignore` and never committed to version control
- [x] Keep PostgreSQL and Redis ports bound strictly to Docker bridge network
- [x] Deploy behind an HTTPS/TLS reverse proxy with HSTS enabled
