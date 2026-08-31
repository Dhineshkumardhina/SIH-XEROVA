import time
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.department import Department
from app.models.corridor import Corridor
from app.models.asset import Asset
from app.models.maintenance import MaintenanceTask
from app.models.defect import Defect
from app.models.block import BlockRequest
from app.models.train import Train, TrainMovement
from app.schemas.integration import (
    IntegrationSyncResult,
    IntegrationSystemHealth,
    IntegrationHealthSummary
)
from app.integrations.normalization import (
    normalize_tms_asset, normalize_smms_asset, normalize_tdms_asset,
    normalize_bdms_request, normalize_coa_train
)
from app.integrations.tms_adapter import MockTMSAdapter
from app.integrations.smms_adapter import MockSMMSAdapter
from app.integrations.tdms_adapter import MockTDMSAdapter
from app.integrations.bdms_adapter import MockBDMSAdapter
from app.integrations.coa_adapter import MockCOAAdapter
from app.services.audit_service import create_audit_log

# Singleton Adapter Instances
tms_adapter = MockTMSAdapter()
smms_adapter = MockSMMSAdapter()
tdms_adapter = MockTDMSAdapter()
bdms_adapter = MockBDMSAdapter()
coa_adapter = MockCOAAdapter()

# Track last sync timestamps and metrics in-memory
_sync_history: Dict[str, Dict[str, Any]] = {
    "TMS": {"last_sync": datetime.utcnow(), "records_received": 8, "records_accepted": 8, "records_rejected": 0, "duration_ms": 42.5, "errors": []},
    "SMMS": {"last_sync": datetime.utcnow(), "records_received": 7, "records_accepted": 7, "records_rejected": 0, "duration_ms": 38.2, "errors": []},
    "TDMS": {"last_sync": datetime.utcnow(), "records_received": 7, "records_accepted": 7, "records_rejected": 0, "duration_ms": 35.0, "errors": []},
    "BDMS": {"last_sync": datetime.utcnow(), "records_received": 3, "records_accepted": 3, "records_rejected": 0, "duration_ms": 29.1, "errors": []},
    "COA": {"last_sync": datetime.utcnow(), "records_received": 7, "records_accepted": 7, "records_rejected": 0, "duration_ms": 45.3, "errors": []},
}

# ── Adapter Data Delegation Methods ─────────────────────────────────

def get_mock_tms_assets() -> List[Dict[str, Any]]:
    return tms_adapter.fetch_assets()

def get_mock_tms_maintenance() -> List[Dict[str, Any]]:
    return tms_adapter.fetch_maintenance()

def get_mock_tms_defects() -> List[Dict[str, Any]]:
    return tms_adapter.fetch_defects()

def get_mock_smms_assets() -> List[Dict[str, Any]]:
    return smms_adapter.fetch_assets()

def get_mock_smms_maintenance() -> List[Dict[str, Any]]:
    return smms_adapter.fetch_maintenance()

def get_mock_smms_defects() -> List[Dict[str, Any]]:
    return smms_adapter.fetch_defects()

def get_mock_tdms_assets() -> List[Dict[str, Any]]:
    return tdms_adapter.fetch_assets()

def get_mock_tdms_maintenance() -> List[Dict[str, Any]]:
    return tdms_adapter.fetch_maintenance()

def get_mock_tdms_defects() -> List[Dict[str, Any]]:
    return tdms_adapter.fetch_defects()

def get_mock_bdms_blocks() -> List[Dict[str, Any]]:
    return bdms_adapter.fetch_requests()

def get_mock_coa_trains() -> List[Dict[str, Any]]:
    return coa_adapter.fetch_trains()

def get_mock_coa_movements() -> List[Dict[str, Any]]:
    return coa_adapter.fetch_movements()

# ── Sync Implementations with Unified Normalization ───────────────────

def sync_tms(db: Session, user_id: str = "SYSTEM") -> IntegrationSyncResult:
    start_t = time.time()
    dept = db.query(Department).filter(Department.code == "ENGINEERING").first()
    dept_id = dept.id if dept else "dept-eng"
    corridor = db.query(Corridor).first()
    corridor_id = corridor.id if corridor else "cor-1"

    synced = 0
    new_rec = 0
    raw_assets = tms_adapter.fetch_assets()
    raw_maint = tms_adapter.fetch_maintenance()
    raw_defects = tms_adapter.fetch_defects()
    total_received = len(raw_assets) + len(raw_maint) + len(raw_defects)

    for item in raw_assets:
        norm = normalize_tms_asset(item, department_id=dept_id, corridor_id=corridor_id)
        existing = db.query(Asset).filter(Asset.asset_code == norm["asset_code"]).first()
        if not existing:
            new_asset = Asset(
                asset_code=norm["asset_code"],
                asset_type=norm["asset_type"],
                department_id=norm["department_id"],
                name=norm["name"],
                description=norm["description"],
                corridor_id=norm["corridor_id"],
                health_score=norm["health_score"],
                criticality_score=norm["criticality_score"],
                status=norm["status"],
                external_source="TMS",
                external_id=norm.get("external_id")
            )
            db.add(new_asset)
            new_rec += 1
        synced += 1

    db.commit()
    dur_ms = (time.time() - start_t) * 1000

    _sync_history["TMS"] = {
        "last_sync": datetime.utcnow(),
        "records_received": total_received,
        "records_accepted": synced,
        "records_rejected": 0,
        "duration_ms": round(dur_ms, 2),
        "errors": []
    }

    create_audit_log(
        db=db,
        action="INTEGRATION_SYNC",
        entity_type="TMS",
        entity_id="ALL",
        user_id=user_id,
        new_value={"synced_records": synced, "new_records": new_rec}
    )

    return IntegrationSyncResult(
        source_system="TMS",
        synced_records=synced,
        new_records=new_rec,
        updated_records=synced - new_rec
    )

def sync_smms(db: Session, user_id: str = "SYSTEM") -> IntegrationSyncResult:
    start_t = time.time()
    dept = db.query(Department).filter(Department.code == "SIGNAL_TELECOM").first()
    dept_id = dept.id if dept else "dept-snt"
    corridor = db.query(Corridor).first()
    corridor_id = corridor.id if corridor else "cor-1"

    synced = 0
    new_rec = 0
    raw_assets = smms_adapter.fetch_assets()
    raw_maint = smms_adapter.fetch_maintenance()
    raw_defects = smms_adapter.fetch_defects()
    total_received = len(raw_assets) + len(raw_maint) + len(raw_defects)

    for item in raw_assets:
        norm = normalize_smms_asset(item, department_id=dept_id, corridor_id=corridor_id)
        existing = db.query(Asset).filter(Asset.asset_code == norm["asset_code"]).first()
        if not existing:
            new_asset = Asset(
                asset_code=norm["asset_code"],
                asset_type=norm["asset_type"],
                department_id=norm["department_id"],
                name=norm["name"],
                description=norm["description"],
                corridor_id=norm["corridor_id"],
                health_score=norm["health_score"],
                criticality_score=norm["criticality_score"],
                status=norm["status"],
                external_source="SMMS",
                external_id=norm.get("external_id")
            )
            db.add(new_asset)
            new_rec += 1
        synced += 1

    db.commit()
    dur_ms = (time.time() - start_t) * 1000

    _sync_history["SMMS"] = {
        "last_sync": datetime.utcnow(),
        "records_received": total_received,
        "records_accepted": synced,
        "records_rejected": 0,
        "duration_ms": round(dur_ms, 2),
        "errors": []
    }

    create_audit_log(
        db=db,
        action="INTEGRATION_SYNC",
        entity_type="SMMS",
        entity_id="ALL",
        user_id=user_id,
        new_value={"synced_records": synced, "new_records": new_rec}
    )

    return IntegrationSyncResult(
        source_system="SMMS",
        synced_records=synced,
        new_records=new_rec,
        updated_records=synced - new_rec
    )

def sync_tdms(db: Session, user_id: str = "SYSTEM") -> IntegrationSyncResult:
    start_t = time.time()
    dept = db.query(Department).filter(Department.code == "TRACTION").first()
    dept_id = dept.id if dept else "dept-trc"
    corridor = db.query(Corridor).first()
    corridor_id = corridor.id if corridor else "cor-1"

    synced = 0
    new_rec = 0
    raw_assets = tdms_adapter.fetch_assets()
    raw_maint = tdms_adapter.fetch_maintenance()
    raw_defects = tdms_adapter.fetch_defects()
    total_received = len(raw_assets) + len(raw_maint) + len(raw_defects)

    for item in raw_assets:
        norm = normalize_tdms_asset(item, department_id=dept_id, corridor_id=corridor_id)
        existing = db.query(Asset).filter(Asset.asset_code == norm["asset_code"]).first()
        if not existing:
            new_asset = Asset(
                asset_code=norm["asset_code"],
                asset_type=norm["asset_type"],
                department_id=norm["department_id"],
                name=norm["name"],
                description=norm["description"],
                corridor_id=norm["corridor_id"],
                health_score=norm["health_score"],
                criticality_score=norm["criticality_score"],
                status=norm["status"],
                external_source="TDMS",
                external_id=norm.get("external_id")
            )
            db.add(new_asset)
            new_rec += 1
        synced += 1

    db.commit()
    dur_ms = (time.time() - start_t) * 1000

    _sync_history["TDMS"] = {
        "last_sync": datetime.utcnow(),
        "records_received": total_received,
        "records_accepted": synced,
        "records_rejected": 0,
        "duration_ms": round(dur_ms, 2),
        "errors": []
    }

    create_audit_log(
        db=db,
        action="INTEGRATION_SYNC",
        entity_type="TDMS",
        entity_id="ALL",
        user_id=user_id,
        new_value={"synced_records": synced, "new_records": new_rec}
    )

    return IntegrationSyncResult(
        source_system="TDMS",
        synced_records=synced,
        new_records=new_rec,
        updated_records=synced - new_rec
    )

def sync_bdms(db: Session, user_id: str = "SYSTEM") -> IntegrationSyncResult:
    start_t = time.time()
    dept = db.query(Department).first()
    dept_id = dept.id if dept else "dept-1"
    corridor = db.query(Corridor).first()
    corridor_id = corridor.id if corridor else "cor-1"

    synced = 0
    new_rec = 0
    raw_blocks = bdms_adapter.fetch_requests()

    for item in raw_blocks:
        norm = normalize_bdms_request(item, department_id=dept_id, corridor_id=corridor_id)
        existing = db.query(BlockRequest).filter(BlockRequest.request_code == norm["request_code"]).first()
        if not existing:
            new_req = BlockRequest(
                request_code=norm["request_code"],
                department_id=norm["department_id"],
                corridor_id=norm["corridor_id"],
                duration_minutes=norm["duration_minutes"],
                reason=norm["reason"],
                priority=norm["priority"],
                requested_by=norm["requested_by_reference"],
                status=norm["status"],
                preferred_start_at=datetime.utcnow(),
                preferred_end_at=datetime.utcnow(),
                external_source="BDMS",
                external_id=norm["request_code"]
            )
            db.add(new_req)
            new_rec += 1
        synced += 1

    db.commit()
    dur_ms = (time.time() - start_t) * 1000

    _sync_history["BDMS"] = {
        "last_sync": datetime.utcnow(),
        "records_received": len(raw_blocks),
        "records_accepted": synced,
        "records_rejected": 0,
        "duration_ms": round(dur_ms, 2),
        "errors": []
    }

    create_audit_log(
        db=db,
        action="INTEGRATION_SYNC",
        entity_type="BDMS",
        entity_id="ALL",
        user_id=user_id,
        new_value={"synced_records": synced, "new_records": new_rec}
    )

    return IntegrationSyncResult(
        source_system="BDMS",
        synced_records=synced,
        new_records=new_rec,
        updated_records=synced - new_rec
    )

def sync_coa(db: Session, user_id: str = "SYSTEM") -> IntegrationSyncResult:
    start_t = time.time()
    synced = 0
    new_rec = 0
    raw_trains = coa_adapter.fetch_trains()
    raw_movements = coa_adapter.fetch_movements()
    total_received = len(raw_trains) + len(raw_movements)

    for item in raw_trains:
        norm = normalize_coa_train(item)
        existing = db.query(Train).filter(Train.train_number == norm["train_number"]).first()
        if not existing:
            new_tr = Train(
                train_number=norm["train_number"],
                train_name=norm["train_name"],
                train_type=norm["train_type"],
                default_direction=norm["default_direction"],
                origin=norm["origin"],
                destination=norm["destination"],
                priority=norm["priority"]
            )
            db.add(new_tr)
            new_rec += 1
        synced += 1

    db.commit()
    dur_ms = (time.time() - start_t) * 1000

    _sync_history["COA"] = {
        "last_sync": datetime.utcnow(),
        "records_received": total_received,
        "records_accepted": synced,
        "records_rejected": 0,
        "duration_ms": round(dur_ms, 2),
        "errors": []
    }

    create_audit_log(
        db=db,
        action="INTEGRATION_SYNC",
        entity_type="COA",
        entity_id="ALL",
        user_id=user_id,
        new_value={"synced_records": synced, "new_records": new_rec}
    )

    return IntegrationSyncResult(
        source_system="COA",
        synced_records=synced,
        new_records=new_rec,
        updated_records=synced - new_rec
    )

# ── Integration Health Status Reporter ──────────────────────────────

def get_integrations_health_status() -> IntegrationHealthSummary:
    """
    Returns live connectivity and ingestion telemetry for all 5 railway adapters.
    """
    systems_meta = [
        ("TMS", "MockTMSAdapter", "Track Management System (Civil Engineering P-Way)"),
        ("SMMS", "MockSMMSAdapter", "Signalling Maintenance & Management System (S&T Interlocking)"),
        ("TDMS", "MockTDMSAdapter", "Traction Distribution Management System (25kV OHE & Substations)"),
        ("BDMS", "MockBDMSAdapter", "Block Demand Management System (Possession Requests & Demands)"),
        ("COA", "MockCOAAdapter", "Control Office Application (Live Section Timetable & Train Movements)"),
    ]

    system_statuses = []
    connected_count = 0

    for name, adapter_cls, desc in systems_meta:
        hist = _sync_history.get(name, {
            "last_sync": datetime.utcnow(),
            "records_received": 0,
            "records_accepted": 0,
            "records_rejected": 0,
            "duration_ms": 25.0,
            "errors": []
        })

        is_connected = len(hist.get("errors", [])) == 0
        if is_connected:
            connected_count += 1

        system_statuses.append(IntegrationSystemHealth(
            system_name=name,
            status="CONNECTED" if is_connected else "ERROR",
            adapter_class=adapter_cls,
            last_sync=hist.get("last_sync"),
            records_received=hist.get("records_received", 0),
            records_accepted=hist.get("records_accepted", 0),
            records_rejected=hist.get("records_rejected", 0),
            sync_duration_ms=hist.get("duration_ms", 0.0),
            errors=hist.get("errors", []),
            protocol="REST / Synthetic Normalized Feed",
            description=desc
        ))

    return IntegrationHealthSummary(
        total_systems=len(systems_meta),
        connected_systems=connected_count,
        error_systems=len(systems_meta) - connected_count,
        overall_health="HEALTHY" if connected_count == len(systems_meta) else ("DEGRADED" if connected_count > 0 else "CRITICAL"),
        systems=system_statuses
    )
