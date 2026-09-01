"""
RAILOPT AI — Phase 28 Database Seeding & Setup Script

=====================================================================
NOTICE: SYNTHETIC DEMONSTRATION DATA
This script populates synthetic railway operational data for testing
and evaluation purposes. It does NOT represent real operational or
classified Indian Railways infrastructure.
=====================================================================

Usage:
  python scripts/seed_database.py --seed
  python scripts/seed_database.py --reset
  python scripts/seed_database.py --demo
  python scripts/seed_database.py --reset --seed --demo
"""
import sys
import os
import argparse
from datetime import datetime, timezone, timedelta
import random

# Configure UTF-8 stdout if supported
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.session import engine, SessionLocal
from app.models import (
    Base,
    Department, DepartmentType, Zone, Division, Station, Corridor,
    Asset, AssetType, AssetStatus,
    TrackAsset, SignalAsset, TelecomAsset, OHEAsset, Feeder, Transformer, Substation, PointMachine,
    AssetHealth, Inspection, MaintenanceTask, MaintenanceHistory,
    Defect, DefectSeverity, Train, TrainSchedule, TrainMovement, GoodsForecast,
    BlockRequest, BlockPlan, BlockTask, BlockConflict, BlockApproval,
    AssetRiskPrediction, AIPrediction, AIRecommendation,
    OptimizationRun, OptimizationResult, SimulationScenario, SimulationRun, SimulationEvent,
    Notification, AuditLog, SystemSetting, User,
    BlockRequestStatus, PriorityLevel
)
from app.core.security import get_password_hash


def clear_database(db):
    print("Resetting database schema (drop_all & create_all)...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("Database schema reset successfully.")


def seed_core_data(db):
    print("Seeding core normalized CRDM entities (Idempotent)...")
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # 1. Departments
    dept_map = {}
    dept_configs = [
        (DepartmentType.ENGINEERING, "Track Engineering Department (TMS)", "Responsible for track alignment, rails, sleepers, points, and ballast stability."),
        (DepartmentType.SIGNAL_TELECOM, "Signaling & Telecom Department (SMMS)", "Responsible for electronic interlocking, color light signals, and point machines."),
        (DepartmentType.TRACTION, "Traction Distribution Department (TDMS)", "Responsible for 25kV OHE catenary wires, traction substations, and switching posts.")
    ]
    for code, name, desc in dept_configs:
        dept = db.query(Department).filter_by(code=code).first()
        if not dept:
            dept = Department(code=code, name=name, description=desc)
            db.add(dept)
            db.flush()
        dept_map[code] = dept
    db.commit()

    dept_eng = dept_map[DepartmentType.ENGINEERING]
    dept_sig = dept_map[DepartmentType.SIGNAL_TELECOM]
    dept_trac = dept_map[DepartmentType.TRACTION]

    # 2. Organizational Hierarchy (Zone -> Division -> Stations)
    zone_sr = db.query(Zone).filter_by(code="ZONE-SR").first()
    if not zone_sr:
        zone_sr = Zone(code="ZONE-SR", name="Southern Railway Zone (Synthetic Demo)")
        db.add(zone_sr)
        db.flush()

    div_mas = db.query(Division).filter_by(code="DIV-MAS").first()
    if not div_mas:
        div_mas = Division(zone_id=zone_sr.id, code="DIV-MAS", name="Chennai Division (Synthetic Demo)")
        db.add(div_mas)
        db.flush()
    db.commit()

    # 6 Stations (STN-A to STN-F)
    station_configs = [
        ("STN-A", "Station Alpha (Synthetic)", 13.0827, 80.2707),
        ("STN-B", "Station Bravo (Synthetic Junction)", 13.1986, 79.7946),
        ("STN-C", "Station Charlie (Synthetic Terminal)", 13.2500, 79.6000),
        ("STN-D", "Station Delta (Synthetic Freight Yard)", 13.3100, 79.4500),
        ("STN-E", "Station Echo (Synthetic Central)", 13.3900, 79.2800),
        ("STN-F", "Station Foxtrot (Synthetic Industrial)", 13.4500, 79.1500),
    ]
    station_map = {}
    for code, name, lat, lon in station_configs:
        stn = db.query(Station).filter_by(code=code).first()
        if not stn:
            stn = Station(division_id=div_mas.id, code=code, name=name, latitude=lat, longitude=lon)
            db.add(stn)
            db.flush()
        station_map[code] = stn
    db.commit()

    stn_a = station_map["STN-A"]
    stn_b = station_map["STN-B"]
    stn_c = station_map["STN-C"]
    stn_d = station_map["STN-D"]
    stn_e = station_map["STN-E"]
    stn_f = station_map["STN-F"]

    # 3. 5 Corridors (COR-A01 to COR-E05)
    corridor_configs = [
        ("COR-A01", "Alpha-Bravo Main Trunk Corridor", stn_a.id, stn_b.id, 45.2, 2, True, [[80.2707, 13.0827], [79.7946, 13.1986]]),
        ("COR-B02", "Bravo-Charlie Freight Trunk Corridor", stn_b.id, stn_c.id, 32.8, 2, True, [[79.7946, 13.1986], [79.6000, 13.2500]]),
        ("COR-C03", "Charlie-Delta Suburban Line", stn_c.id, stn_d.id, 28.5, 2, True, [[79.6000, 13.2500], [79.4500, 13.3100]]),
        ("COR-D04", "Delta-Echo Express Corridor", stn_d.id, stn_e.id, 38.0, 2, True, [[79.4500, 13.3100], [79.2800, 13.3900]]),
        ("COR-E05", "Echo-Foxtrot Industrial Spur", stn_e.id, stn_f.id, 22.4, 1, True, [[79.2800, 13.3900], [79.1500, 13.4500]]),
    ]
    corridor_map = {}
    for code, name, start_id, end_id, dist, tracks, elec, coords in corridor_configs:
        corr = db.query(Corridor).filter_by(code=code).first()
        if not corr:
            corr = Corridor(
                code=code,
                name=name,
                start_station_id=start_id,
                end_station_id=end_id,
                distance_km=dist,
                track_count=tracks,
                electrified=elec,
                status="OPERATIONAL",
                geometry={"type": "LineString", "coordinates": coords}
            )
            db.add(corr)
            db.flush()
        corridor_map[code] = corr
    db.commit()

    corridor_1 = corridor_map["COR-A01"]
    corridor_2 = corridor_map["COR-B02"]
    corridor_3 = corridor_map["COR-C03"]
    corridor_4 = corridor_map["COR-D04"]
    corridor_5 = corridor_map["COR-E05"]
    all_corridors = [corridor_1, corridor_2, corridor_3, corridor_4, corridor_5]

    # 4. 55+ Assets Across All Departments
    print("Seeding 55+ CRDM Assets...")
    asset_defs = [
        # Engineering (Tracks)
        ("TRK-1001", AssetType.TRACK, dept_eng.id, "Main Line Rail Section STN-A Km 12.0-15.0", stn_a.id, corridor_1.id, 85.0, 78.5, AssetStatus.HEALTHY, "TMS", "TMS-TRK-1001"),
        ("TRK-1002", AssetType.TRACK, dept_eng.id, "High Wear Curved Track Segment STN-A to STN-B", stn_a.id, corridor_1.id, 95.0, 52.0, AssetStatus.CRITICAL, "TMS", "TMS-TRK-1002"),
        ("TRK-1003", AssetType.TRACK, dept_eng.id, "Main Line Down Track STN-B Km 20.0-25.0", stn_b.id, corridor_1.id, 80.0, 85.0, AssetStatus.HEALTHY, "TMS", "TMS-TRK-1003"),
        ("TRK-1004", AssetType.TRACK, dept_eng.id, "Freight Yard Loop Track Bravo #3", stn_b.id, corridor_2.id, 75.0, 68.0, AssetStatus.MONITOR, "TMS", "TMS-TRK-1004"),
        ("TRK-1005", AssetType.TRACK, dept_eng.id, "Charlie Terminal Platform 1 Track Bed", stn_c.id, corridor_2.id, 70.0, 92.0, AssetStatus.HEALTHY, "TMS", "TMS-TRK-1005"),
        ("TRK-1006", AssetType.TRACK, dept_eng.id, "Suburban Rail Section Km 02.0-06.0", stn_c.id, corridor_3.id, 65.0, 88.0, AssetStatus.HEALTHY, "TMS", "TMS-TRK-1006"),
        ("TRK-1007", AssetType.TRACK, dept_eng.id, "Delta Yard Reception Track R-4", stn_d.id, corridor_3.id, 78.0, 58.0, AssetStatus.DEGRADED, "TMS", "TMS-TRK-1007"),
        ("TRK-1008", AssetType.TRACK, dept_eng.id, "Delta-Echo High-Speed Fast Track 1", stn_d.id, corridor_4.id, 90.0, 84.0, AssetStatus.HEALTHY, "TMS", "TMS-TRK-1008"),
        ("TRK-1009", AssetType.TRACK, dept_eng.id, "Echo Central Approach Track C-1", stn_e.id, corridor_4.id, 82.0, 71.0, AssetStatus.MONITOR, "TMS", "TMS-TRK-1009"),
        ("TRK-1010", AssetType.TRACK, dept_eng.id, "Foxtrot Industrial Siding Line S-2", stn_f.id, corridor_5.id, 60.0, 64.0, AssetStatus.MONITOR, "TMS", "TMS-TRK-1010"),
        # Signals & Point Machines
        ("SIG-2001", AssetType.SIGNAL, dept_sig.id, "Automatic Multi-Aspect Color Light Signal S-201", stn_a.id, corridor_1.id, 88.0, 82.0, AssetStatus.HEALTHY, "SMMS", "SMMS-SIG-2001"),
        ("SIG-2002", AssetType.POINT_MACHINE, dept_sig.id, "Electric Point Machine P-330 Bravo Yard North", stn_b.id, corridor_1.id, 92.0, 46.0, AssetStatus.DEGRADED, "SMMS", "SMMS-SIG-2002"),
        ("SIG-2003", AssetType.SIGNAL, dept_sig.id, "Starter Signal STN-B Platform 2", stn_b.id, corridor_1.id, 80.0, 90.0, AssetStatus.HEALTHY, "SMMS", "SMMS-SIG-2003"),
        ("SIG-2004", AssetType.POINT_MACHINE, dept_sig.id, "Crossover Point Machine P-104 Charlie Yard", stn_c.id, corridor_2.id, 85.0, 74.0, AssetStatus.MONITOR, "SMMS", "SMMS-SIG-2004"),
        ("SIG-2005", AssetType.SIGNAL, dept_sig.id, "Intermediate Block Signal IBS-301", stn_b.id, corridor_2.id, 86.0, 88.0, AssetStatus.HEALTHY, "SMMS", "SMMS-SIG-2005"),
        ("SIG-2006", AssetType.SIGNAL, dept_sig.id, "Home Signal Delta Yard South", stn_d.id, corridor_3.id, 75.0, 65.0, AssetStatus.MONITOR, "SMMS", "SMMS-SIG-2006"),
        ("SIG-2007", AssetType.POINT_MACHINE, dept_sig.id, "Electro-Hydraulic Point P-512 Delta Junction", stn_d.id, corridor_3.id, 94.0, 54.0, AssetStatus.CRITICAL, "SMMS", "SMMS-SIG-2007"),
        ("SIG-2008", AssetType.SIGNAL, dept_sig.id, "Automatic Signal AS-402 Delta-Echo Section", stn_d.id, corridor_4.id, 82.0, 89.0, AssetStatus.HEALTHY, "SMMS", "SMMS-SIG-2008"),
        ("SIG-2009", AssetType.SIGNAL, dept_sig.id, "Advance Starter Signal STN-E Main Line", stn_e.id, corridor_4.id, 78.0, 92.0, AssetStatus.HEALTHY, "SMMS", "SMMS-SIG-2009"),
        ("SIG-2010", AssetType.POINT_MACHINE, dept_sig.id, "Turnout Point Machine P-601 Foxtrot Siding", stn_f.id, corridor_5.id, 70.0, 76.0, AssetStatus.HEALTHY, "SMMS", "SMMS-SIG-2010"),
        # Telecom Assets
        ("TEL-4001", AssetType.TELECOM, dept_sig.id, "Optical Fiber Cable Ring Station Alpha-Bravo", stn_a.id, corridor_1.id, 90.0, 95.0, AssetStatus.HEALTHY, "SMMS", "SMMS-TEL-4001"),
        ("TEL-4002", AssetType.TELECOM, dept_sig.id, "VHF Digital Wireless Base Station Bravo", stn_b.id, corridor_1.id, 85.0, 88.0, AssetStatus.HEALTHY, "SMMS", "SMMS-TEL-4002"),
        ("TEL-4003", AssetType.TELECOM, dept_sig.id, "GSM-R Cab Radio Base Transceiver Station Charlie", stn_c.id, corridor_2.id, 88.0, 72.0, AssetStatus.MONITOR, "SMMS", "SMMS-TEL-4003"),
        ("TEL-4004", AssetType.TELECOM, dept_sig.id, "Axle Counter Communication Bus Delta", stn_d.id, corridor_3.id, 92.0, 80.0, AssetStatus.HEALTHY, "SMMS", "SMMS-TEL-4004"),
        ("TEL-4005", AssetType.TELECOM, dept_sig.id, "Master Electronic Interlocking Data Link Echo", stn_e.id, corridor_4.id, 95.0, 91.0, AssetStatus.HEALTHY, "SMMS", "SMMS-TEL-4005"),
        # Traction (OHE, Feeders, Transformers, Substations)
        ("OHE-3001", AssetType.OHE, dept_trac.id, "25kV Catenary & Contact Wire Feeder Section #3001", stn_a.id, corridor_1.id, 90.0, 60.0, AssetStatus.MONITOR, "TDMS", "TDMS-OHE-3001"),
        ("OHE-3002", AssetType.OHE, dept_trac.id, "Traction OHE Portal Structure STN-A to STN-B", stn_a.id, corridor_1.id, 82.0, 78.0, AssetStatus.HEALTHY, "TDMS", "TDMS-OHE-3002"),
        ("OHE-3003", AssetType.OHE, dept_trac.id, "25kV Auto-Tensioning Catenary Bravo Section", stn_b.id, corridor_2.id, 88.0, 55.0, AssetStatus.DEGRADED, "TDMS", "TDMS-OHE-3003"),
        ("OHE-3004", AssetType.OHE, dept_trac.id, "Catenary Wire Dropper System Charlie Loop", stn_c.id, corridor_2.id, 75.0, 82.0, AssetStatus.HEALTHY, "TDMS", "TDMS-OHE-3004"),
        ("OHE-3005", AssetType.OHE, dept_trac.id, "Suburban Electrification Catenary Charlie-Delta", stn_c.id, corridor_3.id, 79.0, 86.0, AssetStatus.HEALTHY, "TDMS", "TDMS-OHE-3005"),
        ("OHE-3006", AssetType.OHE, dept_trac.id, "High-Speed Overhead Cantilever Delta-Echo", stn_d.id, corridor_4.id, 92.0, 89.0, AssetStatus.HEALTHY, "TDMS", "TDMS-OHE-3006"),
        ("OHE-3007", AssetType.OHE, dept_trac.id, "Industrial Siding OHE Tension Post Foxtrot", stn_f.id, corridor_5.id, 70.0, 68.0, AssetStatus.MONITOR, "TDMS", "TDMS-OHE-3007"),
        ("TRN-5001", AssetType.TRANSFORMER, dept_trac.id, "Traction Power Transformer 132kV/25kV 30MVA MAS", stn_a.id, corridor_1.id, 96.0, 85.0, AssetStatus.HEALTHY, "TDMS", "TDMS-TR-5001"),
        ("TRN-5002", AssetType.TRANSFORMER, dept_trac.id, "Auxiliary Transformer 25kV/240V Bravo Substation", stn_b.id, corridor_1.id, 80.0, 92.0, AssetStatus.HEALTHY, "TDMS", "TDMS-TR-5002"),
        ("TRN-5003", AssetType.TRANSFORMER, dept_trac.id, "Traction Power Transformer Charlie TSS", stn_c.id, corridor_2.id, 94.0, 62.0, AssetStatus.MONITOR, "TDMS", "TDMS-TR-5003"),
        ("SUB-6001", AssetType.SUBSTATION, dept_trac.id, "Traction Substation (TSS) Alpha North", stn_a.id, corridor_1.id, 98.0, 88.0, AssetStatus.HEALTHY, "TDMS", "TDMS-SUB-6001"),
        ("SUB-6002", AssetType.SUBSTATION, dept_trac.id, "Sectioning and Paralleling Post (SP) Bravo", stn_b.id, corridor_2.id, 90.0, 80.0, AssetStatus.HEALTHY, "TDMS", "TDMS-SUB-6002"),
        ("SUB-6003", AssetType.SUBSTATION, dept_trac.id, "Sub-Sectioning Post (SSP) Delta South", stn_d.id, corridor_3.id, 86.0, 84.0, AssetStatus.HEALTHY, "TDMS", "TDMS-SUB-6003"),
        ("FDR-7001", AssetType.FEEDER, dept_trac.id, "25kV Feeder Line Alpha TSS -> Sector 1", stn_a.id, corridor_1.id, 85.0, 89.0, AssetStatus.HEALTHY, "TDMS", "TDMS-FDR-7001"),
        ("FDR-7002", AssetType.FEEDER, dept_trac.id, "25kV Feeder Line Bravo SP -> Sector 2", stn_b.id, corridor_2.id, 84.0, 87.0, AssetStatus.HEALTHY, "TDMS", "TDMS-FDR-7002"),
    ]

    # Add 15 more procedural assets to exceed 50 assets
    for i in range(1, 16):
        c_idx = i % len(all_corridors)
        corr_target = all_corridors[c_idx]
        stn_target = station_map[f"STN-{chr(65 + (i % 6))}"]
        a_code = f"AST-GEN-{1000 + i}"
        if i % 3 == 0:
            asset_defs.append((a_code, AssetType.TRACK, dept_eng.id, f"Procedural Track Segment #{i}", stn_target.id, corr_target.id, 75.0 + (i % 20), 70.0 + (i % 25), AssetStatus.HEALTHY, "TMS", f"TMS-{a_code}"))
        elif i % 3 == 1:
            asset_defs.append((a_code, AssetType.SIGNAL, dept_sig.id, f"Procedural Signal Assembly #{i}", stn_target.id, corr_target.id, 80.0 + (i % 15), 75.0 + (i % 20), AssetStatus.HEALTHY, "SMMS", f"SMMS-{a_code}"))
        else:
            asset_defs.append((a_code, AssetType.OHE, dept_trac.id, f"Procedural OHE Isolator #{i}", stn_target.id, corr_target.id, 82.0 + (i % 15), 65.0 + (i % 30), AssetStatus.HEALTHY, "TDMS", f"TDMS-{a_code}"))

    asset_map = {}
    for code, a_type, d_id, name, s_id, c_id, crit, health, status, src, ext_id in asset_defs:
        ast = db.query(Asset).filter_by(asset_code=code).first()
        if not ast:
            ast = Asset(
                asset_code=code,
                asset_type=a_type,
                department_id=d_id,
                name=name,
                description=f"Synthetic asset {code} for decision support testing",
                station_id=s_id,
                corridor_id=c_id,
                criticality_score=crit,
                health_score=health,
                status=status,
                external_source=src,
                external_id=ext_id,
                last_inspection_at=now - timedelta(days=10),
                next_inspection_at=now + timedelta(days=20),
                maintenance_due_at=now + timedelta(days=15)
            )
            db.add(ast)
            db.flush()
        asset_map[code] = ast
    db.commit()

    all_asset_list = list(asset_map.values())
    print(f"Total Assets registered: {len(all_asset_list)}")

    # 5. Specialized Department Tables (1-to-1)
    if "TRK-1001" in asset_map and not db.query(TrackAsset).filter_by(asset_id=asset_map["TRK-1001"].id).first():
        db.add(TrackAsset(asset_id=asset_map["TRK-1001"].id, kilometer_from=12.0, kilometer_to=15.0, track_type="MAIN_LINE", condition="GOOD"))
    if "TRK-1002" in asset_map and not db.query(TrackAsset).filter_by(asset_id=asset_map["TRK-1002"].id).first():
        db.add(TrackAsset(asset_id=asset_map["TRK-1002"].id, kilometer_from=18.5, kilometer_to=21.0, track_type="MAIN_LINE_CURVE", condition="CRITICAL_WEAR"))
    if "SIG-2001" in asset_map and not db.query(SignalAsset).filter_by(asset_id=asset_map["SIG-2001"].id).first():
        db.add(SignalAsset(asset_id=asset_map["SIG-2001"].id, signal_type="4_ASPECT_COLOR_LIGHT", failure_count=0, condition="EXCELLENT"))
    if "SIG-2002" in asset_map and not db.query(PointMachine).filter_by(asset_id=asset_map["SIG-2002"].id).first():
        db.add(PointMachine(asset_id=asset_map["SIG-2002"].id, point_type="ROTARY_143MM", condition="CONTACT_BOUNCE"))
    if "OHE-3001" in asset_map and not db.query(OHEAsset).filter_by(asset_id=asset_map["OHE-3001"].id).first():
        db.add(OHEAsset(asset_id=asset_map["OHE-3001"].id, voltage=25.0, isolation_required=True, condition="DROPPER_SLACK"))
    db.commit()

    # 6. Maintenance Tasks (105+ Tasks)
    print("Seeding 105+ Maintenance Tasks...")
    task_map = {}
    priorities = [PriorityLevel.CRITICAL, PriorityLevel.HIGH, PriorityLevel.MEDIUM, PriorityLevel.LOW]
    statuses = ["PLANNED", "PLANNED", "OVERDUE", "PENDING", "IN_PROGRESS", "COMPLETED"]

    # 5 Core SIH Demo Scenario Benchmark Tasks
    core_tasks = [
        ("MT-0001", "TRK-1002", dept_eng.id, "CORRECTIVE", "Deep Ballast Tamping & Precision Rail Grinding on Curved Track", 6, -3, 120, PriorityLevel.CRITICAL, 95.0, 92.0, 30.0, True, False, "OVERDUE", "Engineering P-Way Gang Alpha", "TMS", "TMS-TASK-001"),
        ("MT-0002", "TRK-1001", dept_eng.id, "PREVENTIVE", "PSC Sleeper Rubber Pad Replacement & Fastener Torque Check", 6, 4, 90, PriorityLevel.HIGH, 75.0, 70.0, 20.0, True, False, "PLANNED", "Engineering Fasteners Unit", "TMS", "TMS-TASK-002"),
        ("MT-0003", "SIG-2001", dept_sig.id, "INSPECTION", "Signal Relay Calibration & Aspect Transformer Testing", 7, 10, 60, PriorityLevel.MEDIUM, 60.0, 65.0, 10.0, True, False, "PLANNED", "Signals Maintenance Squad 1", "SMMS", "SMMS-TASK-001"),
        ("MT-0004", "SIG-2002", dept_sig.id, "CORRECTIVE", "Point Machine Motor Overhaul & Friction Clutch Re-alignment", 8, -1, 180, PriorityLevel.CRITICAL, 98.0, 96.0, 45.0, True, True, "OVERDUE", "Signals Point Specialist Crew", "SMMS", "SMMS-TASK-002"),
        ("MT-0005", "OHE-3001", dept_trac.id, "PREVENTIVE", "25kV Catenary Wire Re-tensioning & Section Insulator Overhaul", 6, 2, 90, PriorityLevel.HIGH, 82.0, 88.0, 25.0, True, True, "PLANNED", "Traction OHE Tower Wagon Crew", "TDMS", "TDMS-TASK-001"),
    ]
    for code, a_code, d_id, t_type, desc, start_hr, due_day, dur, prio, urg, saf, tr_imp, blk, iso, stat, team, src, ext in core_tasks:
        tsk = db.query(MaintenanceTask).filter_by(task_code=code).first()
        if not tsk and a_code in asset_map:
            tsk = MaintenanceTask(
                task_code=code,
                asset_id=asset_map[a_code].id,
                department_id=d_id,
                task_type=t_type,
                description=desc,
                scheduled_start_at=now + timedelta(hours=start_hr),
                due_at=now + timedelta(days=due_day),
                duration_minutes=dur,
                priority=prio,
                urgency=urg,
                safety_impact=saf,
                train_impact=tr_imp,
                block_required=blk,
                isolation_required=iso,
                status=stat,
                assigned_team=team,
                external_source=src,
                external_id=ext
            )
            db.add(tsk)
            db.flush()
        if tsk:
            task_map[code] = tsk
    db.commit()

    # Generate additional tasks up to MT-0105
    for i in range(6, 106):
        code = f"MT-{i:04d}"
        tsk = db.query(MaintenanceTask).filter_by(task_code=code).first()
        if not tsk:
            ast_target = all_asset_list[i % len(all_asset_list)]
            prio = priorities[i % len(priorities)]
            stat = statuses[i % len(statuses)]
            dur = 45 + (i % 6) * 15 # 45 to 120 mins
            d_id = ast_target.department_id
            is_overdue = (stat == "OVERDUE")
            due_delta = -1 * ((i % 5) + 1) if is_overdue else ((i % 14) + 1)

            tsk = MaintenanceTask(
                task_code=code,
                asset_id=ast_target.id,
                department_id=d_id,
                task_type="PREVENTIVE" if i % 2 == 0 else "CORRECTIVE",
                description=f"Standard periodic maintenance task {code} on {ast_target.name}",
                scheduled_start_at=now + timedelta(days=(i % 7), hours=(i % 12)),
                due_at=now + timedelta(days=due_delta),
                duration_minutes=dur,
                priority=prio,
                urgency=60.0 + (i % 35),
                safety_impact=55.0 + (i % 40),
                train_impact=15.0 + (i % 30),
                block_required=True if (i % 3 != 0) else False,
                isolation_required=True if ast_target.asset_type in [AssetType.OHE, AssetType.POINT_MACHINE] else False,
                status=stat,
                assigned_team=f"Depot Maintenance Gang {(i % 5) + 1}",
                external_source=ast_target.external_source,
                external_id=f"{ast_target.external_source}-{code}"
            )
            db.add(tsk)
            db.flush()
        task_map[code] = tsk
    db.commit()
    print(f"Total Maintenance Tasks registered: {len(task_map)}")

    # 7. Defects (65+ Defects)
    print("Seeding 65+ Infrastructure Defects...")
    defect_map = {}
    severities = [DefectSeverity.CRITICAL, DefectSeverity.HIGH, DefectSeverity.MEDIUM, DefectSeverity.LOW]

    # Core Defects
    core_defects = [
        ("DEF-001", "TRK-1002", dept_eng.id, "Gauge face wear exceeding 8mm on outer curved rail section", DefectSeverity.CRITICAL, 89.0, 90.0, 80.0, "TMS", "TMS-DEF-001"),
        ("DEF-002", "SIG-2002", dept_sig.id, "Point machine detection contact intermittent bounce warning", DefectSeverity.CRITICAL, 94.0, 95.0, 88.0, "SMMS", "SMMS-DEF-001"),
        ("DEF-003", "OHE-3001", dept_trac.id, "Contact wire dropper slackening causing minor pantograph arcing", DefectSeverity.HIGH, 78.0, 82.0, 65.0, "TDMS", "TDMS-DEF-001"),
    ]
    for code, a_code, d_id, desc, sev, r_sc, s_imp, op_imp, src, ext in core_defects:
        df = db.query(Defect).filter_by(defect_code=code).first()
        if not df and a_code in asset_map:
            df = Defect(
                defect_code=code,
                asset_id=asset_map[a_code].id,
                department_id=d_id,
                description=desc,
                severity=sev,
                detected_at=now - timedelta(days=4),
                detected_by="SYNTHETIC_DIAGNOSTIC_CREW",
                risk_score=r_sc,
                safety_impact=s_imp,
                operational_impact=op_imp,
                target_resolution_date=now + timedelta(days=2),
                status="OPEN",
                external_source=src,
                external_id=ext
            )
            db.add(df)
            db.flush()
        if df:
            defect_map[code] = df
    db.commit()

    # Generate additional defects up to DEF-065
    for i in range(4, 66):
        code = f"DEF-{i:03d}"
        df = db.query(Defect).filter_by(defect_code=code).first()
        if not df:
            ast_target = all_asset_list[i % len(all_asset_list)]
            sev = severities[i % len(severities)]
            r_sc = 90.0 if sev == DefectSeverity.CRITICAL else (75.0 if sev == DefectSeverity.HIGH else (55.0 if sev == DefectSeverity.MEDIUM else 35.0))
            df = Defect(
                defect_code=code,
                asset_id=ast_target.id,
                department_id=ast_target.department_id,
                description=f"Identified anomaly {code} on {ast_target.name}",
                severity=sev,
                detected_at=now - timedelta(days=(i % 10)),
                detected_by=f"SYNTHETIC_INSPECTOR_{(i % 4) + 1}",
                risk_score=r_sc,
                safety_impact=r_sc,
                operational_impact=r_sc - 10.0,
                target_resolution_date=now + timedelta(days=(i % 7) + 1),
                status="OPEN" if (i % 4 != 0) else "IN_PROGRESS",
                external_source=ast_target.external_source,
                external_id=f"{ast_target.external_source}-{code}"
            )
            db.add(df)
            db.flush()
        defect_map[code] = df
    db.commit()
    print(f"Total Defects registered: {len(defect_map)}")

    # 8. Trains & 105+ Train Schedules
    print("Seeding Trains & 105+ Train Schedules...")
    train_configs = [
        ("12301", "Synthetic Rajdhani Superfast Express", "SUPERFAST", "DOWN", "STN-A", "STN-C", 1),
        ("12302", "Synthetic Rajdhani Return Express", "SUPERFAST", "UP", "STN-C", "STN-A", 1),
        ("12456", "Synthetic Intercity Express", "EXPRESS", "UP", "STN-E", "STN-A", 2),
        ("12457", "Synthetic Intercity Return Express", "EXPRESS", "DOWN", "STN-A", "STN-E", 2),
        ("12007", "Synthetic Shatabdi Express", "SUPERFAST", "DOWN", "STN-A", "STN-D", 1),
        ("12008", "Synthetic Shatabdi Return Express", "SUPERFAST", "UP", "STN-D", "STN-A", 1),
        ("16127", "Synthetic Guruvayur Express", "EXPRESS", "DOWN", "STN-A", "STN-F", 2),
        ("16128", "Synthetic Guruvayur Return Express", "EXPRESS", "UP", "STN-F", "STN-A", 2),
        ("22601", "Synthetic Vande Bharat Superfast", "SUPERFAST", "DOWN", "STN-A", "STN-E", 1),
        ("22602", "Synthetic Vande Bharat Return", "SUPERFAST", "UP", "STN-E", "STN-A", 1),
        ("G-5501", "Synthetic Container Freight Rake A", "GOODS", "DOWN", "STN-A", "STN-B", 4),
        ("G-5502", "Synthetic Coal Freight Rake B", "GOODS", "UP", "STN-D", "STN-A", 4),
        ("G-5503", "Synthetic Cement Freight Rake C", "GOODS", "DOWN", "STN-C", "STN-F", 4),
        ("G-5504", "Synthetic Automobile Rake D", "GOODS", "UP", "STN-F", "STN-B", 4),
        ("SUB-901", "Synthetic Suburban Local 901", "PASSENGER", "DOWN", "STN-A", "STN-C", 3),
        ("SUB-902", "Synthetic Suburban Local 902", "PASSENGER", "UP", "STN-C", "STN-A", 3),
    ]
    train_map = {}
    for num, name, t_type, direction, orig, dest, prio in train_configs:
        tr = db.query(Train).filter_by(train_number=num).first()
        if not tr:
            tr = Train(
                train_number=num,
                train_name=name,
                train_type=t_type,
                default_direction=direction,
                origin=orig,
                destination=dest,
                priority=prio
            )
            db.add(tr)
            db.flush()
        train_map[num] = tr
    db.commit()

    all_train_list = list(train_map.values())

    # Build 105+ Train Schedules across corridors
    schedule_count = db.query(TrainSchedule).count()
    if schedule_count < 105:
        print("Populating train timetable schedules...")
        seq = 1
        for tr in all_train_list:
            for day_offset in range(0, 3): # 3-day schedule horizon
                plan_date = now + timedelta(days=day_offset)
                base_time = plan_date.replace(hour=5 + (hash(tr.train_number) % 14), minute=0, second=0, microsecond=0)
                
                # Traverse corridor chain
                for c_idx, corr in enumerate(all_corridors[:3]):
                    arr = base_time + timedelta(hours=c_idx, minutes=10)
                    dep = arr + timedelta(minutes=5)
                    stn = station_map["STN-A"] if c_idx == 0 else (station_map["STN-B"] if c_idx == 1 else station_map["STN-C"])

                    sch = TrainSchedule(
                        train_id=tr.id,
                        station_id=stn.id,
                        corridor_id=corr.id,
                        sequence_number=seq,
                        scheduled_date=plan_date,
                        arrival_time=arr,
                        departure_time=dep,
                        line="MAIN_1" if tr.default_direction == "DOWN" else "MAIN_2"
                    )
                    db.add(sch)
                    seq += 1
        db.commit()
    print(f"Total Train Schedules registered: {db.query(TrainSchedule).count()}")

    # 9. 35+ Goods Freight Forecasts
    print("Seeding 35+ Goods Freight Forecasts...")
    forecast_count = db.query(GoodsForecast).count()
    if forecast_count < 35:
        densities = ["LOW", "MEDIUM", "HIGH", "PEAK"]
        for i in range(1, 36):
            corr = all_corridors[i % len(all_corridors)]
            h_start = (i * 2) % 24
            h_end = (h_start + 2) if (h_start + 2) <= 24 else 24
            density = densities[i % len(densities)]
            gf = GoodsForecast(
                corridor_id=corr.id,
                forecast_date=now + timedelta(days=(i % 7)),
                hour_start=h_start,
                hour_end=h_end,
                expected_goods_trains=float(1 + (i % 4)),
                traffic_density=density,
                movement_probability=min(0.95, 0.70 + (i % 25) * 0.01),
                model_version="NeuralProphet-Freight-v2.8"
            )
            db.add(gf)
        db.commit()
    print(f"Total Goods Forecasts registered: {db.query(GoodsForecast).count()}")

    # 10. 55+ Block Requests
    print("Seeding 55+ Block Requests...")
    br_count = db.query(BlockRequest).count()
    if br_count < 55:
        # Core SIH Demo Block Requests
        br1 = BlockRequest(
            request_code="REQ-2026-001",
            department_id=dept_eng.id,
            asset_id=asset_map["TRK-1002"].id,
            corridor_id=corridor_1.id,
            requested_date=now,
            preferred_start_at=now + timedelta(hours=5),
            preferred_end_at=now + timedelta(hours=7),
            duration_minutes=120,
            reason="Rail grinding on high-wear curve track STN-A -> STN-B",
            priority="CRITICAL",
            requested_by="SYNTHETIC_DEN_ENGINEERING",
            status="SUBMITTED",
            external_source="BDMS",
            external_id="BDMS-REQ-001"
        )
        br2 = BlockRequest(
            request_code="REQ-2026-002",
            department_id=dept_trac.id,
            asset_id=asset_map["OHE-3001"].id,
            corridor_id=corridor_1.id,
            requested_date=now,
            preferred_start_at=now + timedelta(hours=5, minutes=30),
            preferred_end_at=now + timedelta(hours=7),
            duration_minutes=90,
            reason="OHE contact wire re-tensioning in tandem with track grinding",
            priority="HIGH",
            requested_by="SYNTHETIC_DEE_TRACTION",
            status="SUBMITTED",
            external_source="BDMS",
            external_id="BDMS-REQ-002"
        )
        db.add_all([br1, br2])

        for i in range(3, 56):
            req_code = f"REQ-2026-{i:03d}"
            ast_target = all_asset_list[i % len(all_asset_list)]
            corr_target = all_corridors[i % len(all_corridors)]
            br = BlockRequest(
                request_code=req_code,
                department_id=ast_target.department_id,
                asset_id=ast_target.id,
                corridor_id=corr_target.id,
                requested_date=now + timedelta(days=(i % 5)),
                preferred_start_at=now + timedelta(days=(i % 5), hours=(i % 12) + 1),
                preferred_end_at=now + timedelta(days=(i % 5), hours=(i % 12) + 3),
                duration_minutes=120,
                reason=f"Scheduled possession block demand {req_code} on {ast_target.name}",
                priority="CRITICAL" if (i % 3 == 0) else ("HIGH" if (i % 2 == 0) else "MEDIUM"),
                requested_by=f"SYNTHETIC_DISPATCHER_{(i % 3) + 1}",
                status="SUBMITTED" if (i % 2 == 0) else "APPROVED",
                external_source="BDMS",
                external_id=f"BDMS-{req_code}"
            )
            db.add(br)
        db.commit()
    print(f"Total Block Requests registered: {db.query(BlockRequest).count()}")

    # 11. Bundled Block Plan (BP-0001) for SIH Demo
    bp1 = db.query(BlockPlan).filter_by(plan_code="BP-0001").first()
    if not bp1:
        bp1 = BlockPlan(
            plan_code="BP-0001",
            corridor_id=corridor_1.id,
            planned_start_at=now + timedelta(hours=5),
            planned_end_at=now + timedelta(hours=7),
            duration_minutes=120,
            status="APPROVED",
            planning_horizon="DAILY",
            optimization_score=94.5,
            expected_train_delay=0,
            asset_availability_gain=15.0,
            generated_by="SYNTHETIC_CHIEF_CONTROLLER_PATEL"
        )
        db.add(bp1)
        db.flush()

        bt1 = BlockTask(block_plan_id=bp1.id, maintenance_task_id=task_map["MT-0001"].id, sequence_order=1, planned_duration_minutes=120)
        bt2 = BlockTask(block_plan_id=bp1.id, maintenance_task_id=task_map["MT-0002"].id, sequence_order=2, planned_duration_minutes=90)
        bt3 = BlockTask(block_plan_id=bp1.id, maintenance_task_id=task_map["MT-0005"].id, sequence_order=3, planned_duration_minutes=90)
        db.add_all([bt1, bt2, bt3])

        approval = BlockApproval(
            block_plan_id=bp1.id,
            action="APPROVED",
            approved_by="SYNTHETIC_CHIEF_CONTROLLER_PATEL",
            comments="Multi-department shadow block approved during zero-traffic night slot."
        )
        db.add(approval)
        db.commit()

    # 12. System Settings
    setting = db.query(SystemSetting).filter_by(key="OPTIMIZATION_PARAMETERS").first()
    if not setting:
        setting = SystemSetting(
            key="OPTIMIZATION_PARAMETERS",
            value={"max_delay_threshold_minutes": 15, "min_block_duration_minutes": 60, "shadow_bundling_enabled": True},
            description="Global parameters for AI multi-department block optimizer"
        )
        db.add(setting)
        db.commit()

    print("All core CRDM entities seeded successfully.")


def seed_demo_data(db):
    print("Seeding extended demonstration scenarios (AI recommendations, predictions, simulation)...")
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    asset_trk2 = db.query(Asset).filter_by(asset_code="TRK-1002").first()

    if asset_trk2 and not db.query(AssetRiskPrediction).filter_by(asset_id=asset_trk2.id).first():
        db.add(AssetRiskPrediction(
            asset_id=asset_trk2.id,
            failure_probability=0.87,
            risk_level="CRITICAL",
            model_name="TrackWearXGBoost",
            model_version="v2.4-synthetic",
            prediction_date=now,
            recommended_action="Execute urgent rail grinding within 48h to prevent rail fracture"
        ))

    if not db.query(AIRecommendation).filter_by(recommendation_type="CONSOLIDATED_SHADOW_BLOCK").first():
        db.add(AIRecommendation(
            recommendation_type="CONSOLIDATED_SHADOW_BLOCK",
            entity_type="CORRIDOR",
            entity_id="COR-A01",
            recommendation="Consolidate Engineering Ballast Tamping with Traction OHE Wire Re-tensioning in a single 120-minute shadow window.",
            confidence=96.5,
            factors={"traffic_lull_window": "01:00-03:00", "speed_restriction_avoidance": True},
            expected_impact="Saves 150 minutes of track occupancy downtime"
        ))

    if not db.query(SimulationScenario).filter_by(name="Peak Freight Surge vs Block Window").first():
        scenario = SimulationScenario(
            name="Peak Freight Surge vs Block Window",
            description="Evaluates throughput resilience when 3 container trains encounter maintenance block BP-0001",
            scenario_type="SHADOW_BLOCK_SIMULATION"
        )
        db.add(scenario)
    db.commit()
    print("Extended demonstration scenarios seeded successfully.")


def main():
    parser = argparse.ArgumentParser(description="RAILOPT AI Database Seeder")
    parser.add_argument("--reset", action="store_true", help="Clear all existing database records")
    parser.add_argument("--seed", action="store_true", help="Seed standard synthetic CRDM records")
    parser.add_argument("--demo", action="store_true", help="Seed advanced demonstration data (AI/Simulation)")

    args = parser.parse_args()

    # If no flags passed, default to --seed
    if not (args.reset or args.seed or args.demo):
        args.seed = True

    print("=" * 65)
    print("RAILOPT AI — Database Seeding System")
    print("NOTICE: SYNTHETIC DEMONSTRATION DATA")
    print("=" * 65)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if args.reset:
            clear_database(db)
        if args.seed:
            seed_core_data(db)
            from scripts.seed_auth import seed_auth_data
            seed_auth_data(db)
        if args.demo:
            seed_demo_data(db)
    finally:
        db.close()

    print("=" * 65)
    print("Database seeding completed successfully.")
    print("=" * 65)


if __name__ == "__main__":
    main()
