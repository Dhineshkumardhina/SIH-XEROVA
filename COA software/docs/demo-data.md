# RAILOPT AI — Synthetic Demonstration Data Reference
**Smart India Hackathon (SIH) — Network Topology & Workload Catalog**
*Demonstration Environment • Synthetic Railway Operations Data*

---

> [!NOTE]
> **SYNTHETIC DEMONSTRATION DATA**
> All railway infrastructure data, station names, asset numbers, train numbers, and maintenance logs described herein are synthetic and created solely to simulate realistic Indian Railways operations.

---

## 1. Demonstration Corridors & Stations

### Corridors:
1. **`COR-NDLS-CNB` (New Delhi – Kanpur Central High-Density Trunk)**:
   - Length: 440 km
   - Track Type: Double Line (Electrified, Automatic Block Signalling)
   - Max Speed: 130 km/h
   - Line Capacity: 120 trains/day
2. **`COR-BCT-ADI` (Mumbai Central – Ahmedabad Semi-High Speed Section)**:
   - Length: 490 km
   - Track Type: Double Line (Electrified, 25 kV AC)
   - Max Speed: 160 km/h (Vande Bharat Corridor)
   - Line Capacity: 110 trains/day

### Stations:
- **`NDLS`** (New Delhi), **`GZB`** (Ghaziabad), **`ALJN`** (Aligarh Jn), **`TDL`** (Tundla Jn), **`CNB`** (Kanpur Central).
- **`MMCT`** (Mumbai Central), **`BVI`** (Borivali), **`ST`** (Surat), **`BRC`** (Vadodara Jn), **`ADI`** (Ahmedabad Jn).

---

## 2. Asset Catalog & Health Breakdown

| Asset Code | Asset Name | Department | Section / KM | Health Index | Defect Status |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `TRK-1001` | UIC 60kg Continuous Welded Rail | Engineering | KM 124.0 – 128.5 | 78 / 100 | Minor Gauge Wear |
| `TRK-1002` | Turnout / Switch Assembly 1:12 | Engineering | KM 142.2 (Aligarh Yard) | 34 / 100 | **CRITICAL (USFD Rail Crack)** |
| `SIG-2001` | Multi-Aspect Color Light Signal | Signal & Telecom | Signal Post S-42 | 82 / 100 | Operational |
| `SIG-2002` | Point Machine (Electric 143mm) | Signal & Telecom | Point 104A (Tundla) | 58 / 100 | High Vibration Anomaly |
| `TRC-3001` | OHE Catenary & Contact Wire | Traction | Section CNB-FD-04 | 45 / 100 | Dropper Slackness |
| `TRC-3002` | 25kV Traction Substation | Traction | Substation TDL-TSS | 91 / 100 | Operational |

---

## 3. Demonstration Maintenance Backlog

1. **`TASK-ENG-01` (Track Ballast Tamping & Deep Screening)**:
   - Duration: 120 minutes | Department: Civil Engineering
   - Urgent due to Track Geometry Index degradation at KM 142.
2. **`TASK-SIG-01` (Point Machine Rod Adjustment & Insulation Check)**:
   - Duration: 90 minutes | Department: Signal & Telecom
   - Located at same sectional block (KM 142).
3. **`TASK-TRC-01` (OHE Wire Re-tensioning & Insulator Cleaning)**:
   - Duration: 90 minutes | Department: Electrical / Traction
   - Requires 25kV power isolation on the same track segment.

*Optimization Challenge: Demonstrates how RAILOPT AI identifies that all 3 tasks can be bundled into a single 120-minute shadow block instead of taking 3 separate 90–120 minute blocks.*
