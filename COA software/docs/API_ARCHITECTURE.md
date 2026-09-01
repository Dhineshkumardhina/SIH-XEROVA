# API ARCHITECTURE — RAILOPT AI

## 1. API Architecture Overview

**RAILOPT AI** provides a standardized RESTful API (`/api/v1`) alongside a bi-directional real-time WebSocket channel (`/ws/operations`).

All REST API endpoints adhere to strict JSON response conventions, consistent error schemas, and Bearer Token authentication.

---

## 2. Standard Response Format

### 2.1 Success Response Schema
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### 2.2 Error Response Schema
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Asset with ID AST-TRACK-001 not found.",
    "details": null
  }
}
```

---

## 3. Core Endpoint Catalog (`/api/v1`)

| Module | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/v1/auth/login` | Authenticate user credentials & issue JWT tokens |
| **Auth** | `POST` | `/api/v1/auth/refresh` | Refresh expired access token using refresh token |
| **Dashboard** | `GET` | `/api/v1/dashboard/summary` | Retrieve executive KPIs and operational summaries |
| **Assets** | `GET` | `/api/v1/assets` | Query CRDM asset inventory with filters & pagination |
| **Assets** | `GET` | `/api/v1/assets/{id}` | Get detailed asset telemetry, defects, and health score |
| **Maintenance** | `GET` | `/api/v1/maintenance/tasks` | Query maintenance task demands |
| **Maintenance** | `POST`| `/api/v1/maintenance/tasks` | Create new maintenance task demand |
| **Defects** | `GET` | `/api/v1/defects` | Query infrastructure defects & risk levels |
| **Trains** | `GET` | `/api/v1/trains` | Fetch train master directory and timetables |
| **Blocks** | `GET` | `/api/v1/blocks/requests` | Query block possession demands |
| **Blocks** | `POST`| `/api/v1/blocks/requests` | Submit new block possession request |
| **Blocks** | `POST`| `/api/v1/blocks/approve/{id}`| Authorize block plan (Control Officer only) |
| **AI** | `GET` | `/api/v1/ai/priority-matrix` | Fetch AI task priority ratings |
| **Optimization**| `POST`| `/api/v1/planner/generate-daily`| Trigger OR-Tools CP-SAT solver joint block plan |
| **Simulation** | `POST`| `/api/v1/simulation/run` | Launch Digital Twin kinematic scenario |
| **Simulation** | `POST`| `/api/v1/simulation/step` | Advance Digital Twin simulation clock (+5m) |
| **Analytics** | `GET` | `/api/v1/analytics/dashboard` | Query system analytics & before/after metrics |
| **WebSocket** | `WS` | `/ws/operations` | Real-time live train position & block event stream |
