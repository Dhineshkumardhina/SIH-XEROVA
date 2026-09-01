# RAILOPT AI — SYSTEM ARCHITECTURE DOCUMENT

## 1. System Topology Overview

**RAILOPT AI** is an AI-powered automatic railway block planning and asset availability optimization platform designed for Indian Railways.

```mermaid
flowchart TD
    subgraph Legacy Feeds
        TMS[TMS - Track Management]
        SMMS[SMMS - Signal & Telecom]
        TDMS[TDMS - Traction Overhead]
        BDMS[BDMS - Block Demands]
        COA[COA - Control Office Automation]
    end

    subgraph Integration Adapters
        Adapters[Integration Adapters Layer]
    end

    subgraph Core Platform
        CRDM[(Unified CRDM Database - PostgreSQL/PostGIS)]
        AIRisk[AI Risk & Priority Engine]
        Conflict[Spatial-Temporal Conflict Engine]
        Optimizer[Google OR-Tools CP-SAT Optimizer]
        Planner[Multi-Horizon Planner Service]
        DigitalTwin[Digital Twin Kinematic Simulator]
        Audit[Immutable Security Audit Logger]
    end

    subgraph Real-Time Communication
        WS[Redis Pub/Sub & WebSocket Manager /ws/operations]
    end

    subgraph Frontend SPA
        ReactUI[React 19 + TypeScript + Tailwind CSS UI]
    end

    TMS --> Adapters
    SMMS --> Adapters
    TDMS --> Adapters
    BDMS --> Adapters
    COA --> Adapters

    Adapters --> CRDM
    CRDM --> AIRisk
    CRDM --> Conflict
    AIRisk & Conflict --> Optimizer
    Optimizer --> Planner
    Planner --> DigitalTwin
    Planner --> Audit

    Planner --> WS
    WS --> ReactUI
    ReactUI -->|Human Approval| Audit
```

---

## 2. Layer Specifications

1. **Integration Layer**: Normalizes legacy domain events into the Common Railway Data Model (CRDM).
2. **Persistence Layer**: PostgreSQL with PostGIS extension storing 40 normalized tables.
3. **AI & Optimization Layer**: Multi-criteria decision analysis (MCDA) priority model + Google OR-Tools CP-SAT discrete constraint solver with post-solution safety validation (`_validate_block_safety`).
4. **Simulation Layer**: 1D kinematic physics simulator supporting $1\times/2\times/5\times$ speed multipliers and automatic signal aspect state transitions.
5. **Real-Time Communication**: Authenticated WebSocket service (`/ws/operations`) with exponential backoff and Redis Pub/Sub integration.
6. **Frontend SPA**: Responsive React 19 application with Tailwind CSS, Lucide icons, Recharts, and Zustand state management.
