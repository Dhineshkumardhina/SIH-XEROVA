# ROLE-BASED ACCESS CONTROL (RBAC) — RAILOPT AI

## 1. Governance Overview

**RAILOPT AI** enforces strict Role-Based Access Control (RBAC) across both frontend navigation components and backend API endpoints.

This ensures operational separation of concerns between railway maintenance engineering teams, train traffic controllers, divisional executive officers, and system administrators.

---

## 2. Role Definitions

1. **`SUPER_ADMIN`**: System Administrator with full global configuration, user provisioning, system maintenance, and data import privileges.
2. **`CONTROL_OFFICER`**: Divisional Chief Controller with authorization to review, approve, reject, and publish multi-department joint block plans.
3. **`SECTION_CONTROLLER`**: Traffic Controller responsible for live section operations, train movements, and real-time conflict monitoring.
4. **`ENG_MAINTAINER`**: Civil Track Engineering supervisor responsible for track maintenance demands, defects, and TMS task updates.
5. **`SIG_MAINTAINER`**: Signal & Telecom supervisor responsible for point machine, interlocking, and SMMS task updates.
6. **`TRC_MAINTAINER`**: Electrical Traction supervisor responsible for OHE wire, substation, and TDMS task updates.
7. **`VIEWER`**: Read-only guest or auditor user capable of viewing public operational dashboards without edit or approval authority.

---

## 3. Permissions Matrix

| Permission Code | SUPER_ADMIN | CONTROL_OFFICER | SECTION_CONTROLLER | MAINTAINER (ENG/SIG/TRC) | VIEWER |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `DASHBOARD_VIEW` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `ASSETS_VIEW` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `ASSETS_EDIT` | ✅ | ❌ | ❌ | ✅ (Dept Only) | ❌ |
| `MAINTENANCE_VIEW` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `MAINTENANCE_EDIT` | ✅ | ❌ | ❌ | ✅ (Dept Only) | ❌ |
| `TRAINS_VIEW` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `CORRIDORS_VIEW` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `BLOCK_REQUEST_CREATE` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `BLOCK_APPROVE` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `AI_SOLVER_RUN` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `SIMULATION_RUN` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `ADMIN_USERS_MANAGE` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `AUDIT_LOGS_VIEW` | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 4. Enforcement Implementation

### 4.1 Backend API Route Guards (`app/api/dependencies.py`)
- Endpoints use FastAPI dependency injection `Depends(require_permission("PERMISSION_NAME"))` or `Depends(require_role(["ROLE1", "ROLE2"]))`.
- If an unauthorized user attempts access, backend returns `403 Forbidden`:
  ```json
  {
    "success": false,
    "error": {
      "code": "PERMISSION_DENIED",
      "message": "User lacks required BLOCK_APPROVE permission."
    }
  }
  ```

### 4.2 Frontend Route & Navigation Guards (`ProtectedRoute.tsx` & `Sidebar.tsx`)
- `ProtectedRoute`: React Router component validating user roles/permissions before rendering protected routes.
- `Sidebar`: Filters navigation links dynamically based on `currentUser.roles` and `currentUser.permissions`.
