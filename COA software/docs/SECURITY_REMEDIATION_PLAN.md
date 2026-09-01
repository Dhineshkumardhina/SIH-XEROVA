# Security Remediation Plan — RAILOPT AI

This document tracks all security vulnerabilities identified, evaluated, remediated, and verified during the comprehensive DevSecOps audit of the RAILOPT AI platform.

---

## Remediation Matrix

| Finding ID | Title | Severity | Root Cause | Impact | Fix Applied | Status | Verification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Missing Authentication on Block Plans List | **MEDIUM** | `GET /api/v1/blocks` route was defined without the `require_authenticated_user` dependency. | Unauthenticated users could view scheduled corridor block plans. | Added `current_user: User = Depends(require_authenticated_user)` to `get_block_plans` in `blocks.py`. | **FIXED** | Verified with automated pytest `test_unauthenticated_requests_blocked` returning 401. |
| **SEC-02** | Missing CORS Whitelist Parsing Fallback | **LOW** | Malformed JSON strings in `CORS_ORIGINS` environment variable could crash startup or fall back insecurely. | Startup exception during environment variable parsing. | Added robust JSON list parser and comma-separated string fallback in `config.py`. | **FIXED** | Tested with multiple environment strings in `.env`. |
| **SEC-03** | Missing Automated DevSecOps CI Pipeline | **LOW** | Repository lacked a dedicated security CI workflow for pull requests and pushes. | Risk of regressions or dependency vulnerabilities being merged without automated checks. | Created `.github/workflows/security.yml` with SAST (Bandit), secret scanning, and automated security test suite. | **FIXED** | Workflow syntax validated. |
| **SEC-04** | Security Headers Missing on Static API Responses | **LOW** | Default FastAPI responses lacked explicit clickjacking (`X-Frame-Options`) and MIME sniffing headers. | Potential clickjacking or MIME-confusion in downstream consumers. | Added custom middleware injecting `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy` on every response. | **FIXED** | Verified via `test_security_headers_present_on_all_responses`. |
| **SEC-05** | Rate Limiting on Compute-Heavy AI / Optimizer Endpoints | **INFO** | Rapid concurrent calls to Google OR-Tools CP-SAT or AI risk models could consume excessive server CPU. | Resource starvation under simulated load. | Integrated token bucket rate limiter middleware in FastAPI middleware stack. | **FIXED** | Verified rate limiting middleware unit tests. |
| **SEC-06** | Lack of Standardized `.env.example` Documentation | **INFO** | Developers lacked a centralized, redacted environment template distinguishing demo settings from production. | Risk of committing production secrets or using development keys in staging. | Created comprehensive, redacted `.env.example` template with security guidelines. | **FIXED** | Inspected and validated against `Settings` schema. |

---

## Ongoing Hardening Recommendations for Production Railway Deployment:
1. **TLS / HTTPS**: In production, deploy behind an SSL/TLS termination proxy (e.g. AWS ALB, Cloudflare, or Nginx with Let's Encrypt) with HSTS (`Strict-Transport-Security`).
2. **PostgreSQL Network Isolation**: Ensure database port `5432` is bound strictly to the Docker internal bridge network and never published to the public internet.
3. **Secret Store Integration**: For multi-zone enterprise deployment, inject `JWT_SECRET` and `POSTGRES_PASSWORD` via HashiCorp Vault or AWS Secrets Manager.
