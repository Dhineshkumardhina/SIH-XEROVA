# RAILOPT AI — REST & WebSocket API Reference
**Smart India Hackathon (SIH) — Complete Endpoints Specification**
*Demonstration Environment • Synthetic Railway Operations Data*

---

## 1. Unified Response Contract

All REST API endpoints adhere to the standard RAILOPT AI JSON response envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

Paginated collections use:
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "page_size": 25,
      "total": 120,
      "total_pages": 5
    }
  },
  "message": "Items retrieved"
}
```

Error responses return:
```json
{
  "success": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "You lack the required authority (BLOCK_APPROVE)",
    "details": null
  }
}
```

---

## 2. Core API Endpoints

### 2.1 Authentication (`/api/v1/auth`)
| Method | Endpoint | Purpose | Authorization |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Authenticate user, issue JWT access token and refresh token | Public |
| `POST` | `/api/v1/auth/refresh` | Rotate expired JWT access token using database-hashed refresh token | Public |
| `POST` | `/api/v1/auth/logout` | Revoke active refresh token | Authenticated |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile, roles, and permissions | Authenticated |
| `POST` | `/api/v1/auth/change-password` | Update user password and revoke existing sessions | Authenticated |

### 2.2 Infrastructure & Assets (`/api/v1/assets`, `/api/v1/corridors`)
| Method | Endpoint | Purpose | Authorization |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/corridors` | List high-density railway corridors with status | `CORRIDOR_VIEW` |
| `GET` | `/api/v1/corridors/{id}/availability` | Compute corridor availability index and downtime | `CORRIDOR_VIEW` |
| `GET` | `/api/v1/assets` | Query CRDM asset inventory with filter and pagination | `ASSET_VIEW` |
| `GET` | `/api/v1/assets/{id}` | Retrieve asset detail, condition history, and defect list | `ASSET_VIEW` |
| `POST` | `/api/v1/assets` | Register a new railway asset into inventory | `ASSET_CREATE` |
| `PATCH` | `/api/v1/assets/{id}` | Update asset status or physical coordinates | `ASSET_UPDATE` |

### 2.3 Maintenance & Defects (`/api/v1/maintenance`, `/api/v1/defects`)
| Method | Endpoint | Purpose | Authorization |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/maintenance` | List maintenance tasks by department or status | `MAINTENANCE_VIEW` |
| `GET` | `/api/v1/maintenance/overdue` | Query overdue maintenance demands across network | `MAINTENANCE_VIEW` |
| `POST` | `/api/v1/maintenance` | Create a new maintenance demand | `MAINTENANCE_CREATE` |
| `PATCH` | `/api/v1/maintenance/{id}/status` | Transition task state (`PLANNED`, `IN_PROGRESS`, `COMPLETED`) | `MAINTENANCE_UPDATE` |
| `GET` | `/api/v1/defects` | Query defects by severity rating (`CRITICAL`, `MAJOR`, `MINOR`) | `DEFECT_VIEW` |
| `GET` | `/api/v1/defects/critical` | Real-time feed of safety-critical rail defects | `DEFECT_VIEW` |

### 2.4 Block Requests & Approvals (`/api/v1/blocks`)
| Method | Endpoint | Purpose | Authorization |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/blocks/requests` | List departmental block possession requests | `BLOCK_VIEW` |
| `POST` | `/api/v1/blocks/requests` | Submit a draft block request | `BLOCK_CREATE` |
| `POST` | `/api/v1/blocks/requests/{id}/submit`| Formally submit block request to control office | `BLOCK_CREATE` |
| `POST` | `/api/v1/blocks/plans/{id}/approve` | **Control Officer** approves block plan for execution | `BLOCK_APPROVE` |
| `POST` | `/api/v1/blocks/plans/{id}/reject` | **Control Officer** rejects block plan with comments | `BLOCK_REJECT` |

### 2.5 AI Planning, Optimization & Simulation (`/api/v1/ai`, `/api/v1/optimization`, `/api/v1/simulation`)
| Method | Endpoint | Purpose | Authorization |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/ai/priority/calculate` | Compute 7-factor composite priority score for task | `AI_VIEW` |
| `GET` | `/api/v1/ai/risk/predictions` | Fetch failure probability predictions for assets | `AI_VIEW` |
| `POST` | `/api/v1/optimization/run` | Execute Google OR-Tools CP-SAT multi-block optimization | `OPTIMIZATION_RUN` |
| `POST` | `/api/v1/planner/daily/generate` | Generate 24-hour daily block schedule | `OPTIMIZATION_RUN` |
| `POST` | `/api/v1/planner/weekly/generate` | Generate 7-day multi-corridor weekly plan | `OPTIMIZATION_RUN` |
| `POST` | `/api/v1/planner/monthly/generate`| Generate 30-day major possession monthly plan | `OPTIMIZATION_RUN` |
| `POST` | `/api/v1/simulation/run` | Initialize Digital Twin simulation scenario | `SIMULATION_RUN` |
| `POST` | `/api/v1/simulation/{id}/step` | Advance virtual clock and execute timeline events | `SIMULATION_RUN` |
| `POST` | `/api/v1/simulation/what-if/evaluate`| Run comparative what-if scenario and compute deltas | `SIMULATION_RUN` |

### 2.6 Reports & Analytics (`/api/v1/reports`, `/api/v1/analytics`)
| Method | Endpoint | Purpose | Authorization |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/reports/generate` | Generate PDF or Excel operations report | `REPORT_GENERATE` |
| `GET` | `/api/v1/reports/{id}/download` | Download generated report document binary | `REPORT_VIEW` |
| `GET` | `/api/v1/analytics/dashboard` | Aggregated executive KPIs, availability, and trends | `ANALYTICS_VIEW` |

### 2.7 WebSocket Real-Time Stream (`/ws/operations`)
- **Protocol**: `ws://` / `wss://`
- **Endpoint**: `/ws/operations?token={JWT_ACCESS_TOKEN}`
- **Heartbeat**: Client sends `{"type": "PING"}`, server responds `{"type": "PONG"}`.
- **Broadcast Events**: `TRAIN_MOVEMENT`, `TRAIN_DELAY`, `BLOCK_ACTIVATED`, `BLOCK_COMPLETED`, `NEW_DEFECT`, `AI_ALERT`.
