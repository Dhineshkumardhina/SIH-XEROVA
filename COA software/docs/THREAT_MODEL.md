# STRIDE Threat Model — RAILOPT AI

**Platform**: RAILOPT AI (Decision-Support Block Optimization & Asset Availability Platform)  
**Methodology**: STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)  
**Scope**: All sub-modules, computational engines, persistence layers, and external synthetic boundaries.

---

## 1. System Decomposition & Data Flow Boundaries

```
[Browser Client / Web SPA] 
        │ (HTTPS / WSS + Bearer JWT)
        ▼
[Reverse Proxy / Middleware Gateway] ◄── Rate Limiter / Headers / CORS
        │
        ▼
[FastAPI Application Server]
   ├── [Auth & RBAC Layer]
   ├── [AI Priority & Risk Models]
   ├── [Google OR-Tools CP-SAT Optimizer]
   ├── [Digital Twin Simulation Engine]
   └── [Synthetic Integration Adapters] (TMS, SMMS, TDMS, BDMS, COA)
        │
        ▼ (Internal Bridge Network)
[PostgreSQL DB] + [Redis Pub/Sub]
```

---

## 2. Component Threat Analysis (STRIDE Matrix)

### A. Authentication & User Management
- **Spoofing**: Credential stuffing or token forgery.
  - *Mitigation*: Native bcrypt password hashing, cryptographic JWT signature validation, 15-minute token TTL, and automatic account lockout after 5 consecutive failed attempts.
- **Tampering**: Alteration of JWT payload claims (`sub`, `roles`).
  - *Mitigation*: Strong HS256 HMAC signature verification with server-side secret; token tamper detection tests pass.
- **Elevation of Privilege**: Privilege escalation to `SUPER_ADMIN`.
  - *Mitigation*: Strict server-side role dependency checkers (`require_role`, `require_permission`) on all administrative routes.

### B. Block Optimization & AI Planning Engine
- **Tampering**: Alteration of constraint parameters in optimizer requests to bypass railway safety margins.
  - *Mitigation*: Post-optimization safety validator enforces inviolable physical constraints (headway buffers, speed restrictions, maintenance possession separation) regardless of solver output.
- **Denial of Service**: Triggering huge combinatorial search trees with invalid time horizons to exhaust server CPU/RAM.
  - *Mitigation*: Input bounding (max horizon caps, max candidate window limits), strict Pydantic validation, and solver time limits (10-30s maximum execution budget).

### C. Digital Twin Simulation & WebSockets
- **Information Disclosure**: Unauthorized snooping on live train positions or track occupancy telemetry.
  - *Mitigation*: WebSocket connections require valid JWT token verification during handshake.
- **Denial of Service**: Opening thousands of concurrent WebSocket connections to exhaust server socket descriptors.
  - *Mitigation*: Connection limits per user and heartbeat timeouts handled by `ws_manager`.

### D. Synthetic Railway Integration Adapters (TMS, SMMS, TDMS, BDMS, COA)
- **Spoofing & SSRF**: Outbound connection hijacking or malicious external redirect payloads.
  - *Mitigation*: In this prototype environment, all integrations operate via synthetic in-memory adapters with local sample data and zero outbound network calls.
- **Tampering / CSV Injection**: Upload of malformed train timetables or asset spreadsheets containing executable formulas (`=cmd()`).
  - *Mitigation*: CSV parser sanitizes formula trigger characters (`=`, `+`, `-`, `@`) and enforces strict schema validation.

### E. Persistence Layer (PostgreSQL & Redis)
- **Information Disclosure / SQL Injection**: Exfiltration of user passwords or asset locations.
  - *Mitigation*: 100% parameter-bound queries via SQLAlchemy ORM; database ports restricted to Docker internal network.
- **Repudiation**: Unauthorized deletion or unrecorded modification of maintenance blocks.
  - *Mitigation*: Tamper-resistant `audit_logs` table records actor ID, action type, timestamp, and before/after payloads for all state transitions.

---

## 3. Residual Risk & Assumptions
- **Synthetic Scope**: Adapters are non-production decision-support mocks.
- **Deployment Assumption**: Production deployment will terminate TLS at the reverse proxy and inject secrets via secure cloud KMS / Vault.
