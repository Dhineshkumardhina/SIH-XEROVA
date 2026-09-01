# INTEGRATION ARCHITECTURE — RAILOPT AI

## 1. System Integration Overview

**RAILOPT AI** interfaces with Indian Railways' legacy divisional software applications through an extensible **Integration Adapter Layer**.

Because live railway production networks are physically isolated on secure internal networks, RAILOPT AI implements modular adapter patterns capable of running in two modes:
1. **Live Production Adapter Mode** (REST / SOAP / Database View DB Links)
2. **Simulated Synthetic Feed Mode** (Deterministic SIH Demonstration & Testing)

```
+------------------------------------------------------------------------+
|                      LEGACY SUBSYSTEM ADAPTERS                         |
+------------------------------------------------------------------------+
   │               │               │               │               │
   ▼               ▼               ▼               ▼               ▼
[TMS Adapter]  [SMMS Adapter] [TDMS Adapter] [BDMS Adapter] [COA Adapter]
   │               │               │               │               │
   └───────────────┴───────┬───────┴───────────────┴───────────────┘
                           │
                           ▼
             +---------------------------+
             |   CRDM INGESTION ENGINE   |
             +---------------------------+
                           │
                           ▼
             +---------------------------+
             |   POSTGRESQL CRDM DATA    |
             +---------------------------+
```

---

## 2. Legacy Subsystem Adapters

### 2.1 TMS Adapter (Track Management System - Engineering)
- **Source Subsystem**: TMS (Civil Track Engineering).
- **Ingested Data**: Track geometry measurements (TGI), rail fracture alerts, sleeper replacement schedules, ballast deep screening status.
- **Normalizer Endpoint**: `/api/v1/integrations/tms/sync`

### 2.2 SMMS Adapter (Signal & Telecom System)
- **Source Subsystem**: SMMS (Signal & Telecommunication).
- **Ingested Data**: Point machine operation counts, track circuit failure alerts, axle counter diagnostics, signal interlocking maintenance.
- **Normalizer Endpoint**: `/api/v1/integrations/smms/sync`

### 2.3 TDMS Adapter (Traction Distribution - Electrical OHE)
- **Source Subsystem**: TDMS / SCADA (Electrical Traction).
- **Ingested Data**: Overhead Equipment (OHE) wire height/stagger, isolator switch status, power block requirements, substation transformer maintenance.
- **Normalizer Endpoint**: `/api/v1/integrations/tdms/sync`

### 2.4 BDMS Adapter (Block Demand Management System)
- **Source Subsystem**: BDMS (Divisional Block Request Applications).
- **Ingested Data**: Formally submitted block demand slips, requested duration, section limits, maintenance crew allocations.
- **Normalizer Endpoint**: `/api/v1/integrations/bdms/sync`

### 2.5 COA Adapter (Control Office Application - Traffic Operations)
- **Source Subsystem**: COA (Train Control Office).
- **Ingested Data**: Master train timetables, real-time train movement telemetry, section running times, freight dispatch schedules.
- **Normalizer Endpoint**: `/api/v1/integrations/coa/sync`

---

## 3. Data Translation & Fallback Resilience

### 3.1 Data Translation Pipeline
1. **Raw Payload Ingestion**: Legacy JSON / XML payloads fetched via adapter.
2. **Schema Mapping**: Validated through Pydantic schemas (`app/schemas/integrations.py`).
3. **CRDM Entity Persistence**: Transformed into normalized database entities (`Asset`, `MaintenanceTask`, `TrainSchedule`, `CorridorSection`).

### 3.2 Resilience & Fallback Mechanisms
- **Network Timeout Handling**: 10-second request timeout on external API calls.
- **Fallback Circuit Breaker**: If legacy subsystem APIs drop offline, the adapter logs an integration warning and serves the last cached snapshot from the CRDM database.
- **Presentation Safety**: No fake data is substituted silently. In the event of persistent network loss, the integration layer exposes explicit health status alerts via `/api/v1/health`.
