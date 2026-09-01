# PHASE 36 — SECURITY & RELIABILITY AUDIT REPORT

## 1. Executive Summary

This report documents the security audit, vulnerability assessment, hardening measures, and safety mechanisms implemented for **RAILOPT AI**.

---

## 2. Audit Findings & Resolution Matrix

| Finding ID | Category | Severity | Location | Risk Description | Resolution / Mitigation | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | **Optimizer** | **CRITICAL** | `block_optimizer.py` | Solver might generate blocks exceeding physical track window bounds. | Implemented `_validate_block_safety` post-optimization validation pass. | **RESOLVED** |
| **SEC-02** | **RBAC** | **HIGH** | `block_service.py` | Unauthorized roles (`VIEWER`, `ENGINEERING`) attempting block approval. | Server-side role validation (`CONTROL_OFFICER`, `SUPER_ADMIN`) enforced; rejects with 403. | **RESOLVED** |
| **SEC-03** | **Auth / Rate Limit** | **HIGH** | `rate_limiter.py` | Brute-force attacks on `/auth/login` and solver endpoints. | Thread-safe sliding window rate limiter protects sensitive endpoints. | **RESOLVED** |
| **SEC-04** | **Input Validation** | **MEDIUM** | `schemas/block.py` | Negative duration or invalid dates passed to API. | Pydantic field validation enforcing `gt=0` and date parsing. | **RESOLVED** |
| **SEC-05** | **SQL Safety** | **MEDIUM** | `app/api/*` | Parameterized search queries. | Standardized SQLAlchemy ORM query parameterization; SQL injection strings sanitized. | **RESOLVED** |
| **SEC-06** | **XSS & Headers** | **MEDIUM** | `main.py` | Missing security headers & XSS threats. | Added `nosniff`, `DENY`, and strict referrer policy HTTP headers. | **RESOLVED** |
| **SEC-07** | **AI Safety** | **MEDIUM** | `rule_based.py` | AI recommendations execution risks. | AI labeled advisory-only (`AI DECISION SUPPORT — HUMAN APPROVAL REQUIRED`). | **RESOLVED** |
| **SEC-08** | **Logging** | **LOW** | `core/exceptions.py` | Sensitive token logging in exception stack traces. | Request correlation IDs (`req_xxxxxxxx`) mask credentials and internal backtraces. | **RESOLVED** |

---

## 3. Detailed Security Architecture Findings

### 3.1 Post-Optimization Hard Constraint Safety Pass (Step 10)
Google OR-Tools CP-SAT solver results pass through `_validate_block_safety` prior to returning to the caller. Any block violating duration caps, negative intervals, or invalid corridor identifiers is discarded with a security alert logged.

### 3.2 Server-Side Authorization & Approval Governance (Step 11)
Block request approval (`POST /api/v1/blocks/requests/{id}/approve`) strictly validates that the requesting user possesses `CONTROL_OFFICER` or `SUPER_ADMIN` authority. Every approval generates an immutable audit record containing user ID, timestamp, and previous/new status.

### 3.3 AI Decision-Support Boundary (Step 12)
All AI outputs are explicitly tagged as advisory decision-support. AI engines have no programmatic authority to execute interlocking commands, alter user permissions, or bypass human governance.

### 3.4 Synthetic Demonstration Data Labels (Step 13)
The presentation environment carries prominent visual notices (`DEMONSTRATION ENVIRONMENT — SYNTHETIC DATA`) to prevent confusion with live railway hardware control networks.
