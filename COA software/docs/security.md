# RAILOPT AI — Security, Governance & RBAC Architecture
**Smart India Hackathon (SIH) — Cyber Security & Access Control Reference**
*Demonstration Environment • Synthetic Railway Operations Data*

---

## 1. Security Overview

RAILOPT AI incorporates enterprise defense-in-depth security principles:

```text
+-------------------------------------------------------------------------+
| Layer 1: Transport & Network (HTTPS, WSS, Isolated Docker Bridge Net)    |
+-------------------------------------------------------------------------+
| Layer 2: Authentication (JWT Access Tokens + Database Hashed Refresh)   |
+-------------------------------------------------------------------------+
| Layer 3: Role Authorization (Server-Enforced RBAC on Every Route)       |
+-------------------------------------------------------------------------+
| Layer 4: Departmental Boundaries (Cross-Department Isolation Rules)     |
+-------------------------------------------------------------------------+
| Layer 5: Audit & Compliance (Immutable Action Logging & Lockout Guard)  |
+-------------------------------------------------------------------------+
```

---

## 2. Authentication & Token Management

1. **Short-Lived Access Tokens**:
   - Algorithm: `HS256` signed JWT.
   - Lifetime: 15 minutes.
   - Payload: `sub` (User ID), `username`, `roles`, `permissions`, `department_id`.

2. **Revocable Opaque Refresh Tokens**:
   - Generated via `secrets.token_urlsafe(64)`.
   - Stored in database as cryptographic **SHA-256 hashes** (raw token never stored in plaintext).
   - Lifetime: 7 days.
   - Single-use rotation: Each refresh revokes the old token and issues a new pair.

3. **Account Lockout Guard**:
   - 5 consecutive failed login attempts trigger an automatic 15-minute temporary lockout.
   - Prevents automated brute-force password guessing.

---

## 3. Role-Based Access Control (RBAC) Matrix

| Role | Scope | Key Permissions |
| :--- | :--- | :--- |
| **`SUPER_ADMIN`** | Organization-Wide | All permissions (`USER_CREATE`, `ROLE_UPDATE`, `SYSTEM_SETTINGS_UPDATE`) |
| **`CONTROL_OFFICER`** | Organization-Wide | `BLOCK_APPROVE`, `BLOCK_REJECT`, `BLOCK_VIEW`, `TRAIN_VIEW`, `DASHBOARD_VIEW` |
| **`BLOCK_PLANNER`** | Organization-Wide | `BLOCK_CREATE`, `BLOCK_UPDATE`, `AI_GENERATE`, `OPTIMIZATION_RUN`, `SIMULATION_RUN` |
| **`ENGINEERING_OFFICER`** | `ENGINEERING` | `ASSET_VIEW`, `MAINTENANCE_CREATE`, `BLOCK_CREATE` (Track demands only) |
| **`SIGNAL_TELECOM_OFFICER`**| `SIGNAL_TELECOM`| `ASSET_VIEW`, `MAINTENANCE_CREATE`, `BLOCK_CREATE` (S&T demands only) |
| **`TRACTION_OFFICER`** | `TRACTION` | `ASSET_VIEW`, `MAINTENANCE_CREATE`, `BLOCK_CREATE` (OHE demands only) |
| **`ANALYST`** | Organization-Wide | `ANALYTICS_VIEW`, `REPORT_VIEW`, `REPORT_GENERATE` |
| **`VIEWER`** | Read-Only | `DASHBOARD_VIEW`, `ASSET_VIEW`, `TRAIN_VIEW` (No mutation authority) |

---

## 4. What the System Does NOT Contain
- **No Real Railway Credentials**: All identities and tokens are strictly synthetic demo accounts.
- **No Real Signalling or Interlocking Control**: The system is an advisory decision-support tool. It cannot actuate points, switch physical signals, or trip traction circuit breakers.
