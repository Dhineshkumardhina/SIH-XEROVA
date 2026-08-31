"""
Common Railway Data Model (CRDM) Normalization Layer

Converts heterogeneous raw data from railway legacy and external systems
(TMS, SMMS, TDMS, BDMS, COA) into normalized dictionaries ready for
persisting into the CRDM PostgreSQL database.
"""
from typing import Dict, Any, Optional
from datetime import datetime

def normalize_tms_asset(raw: Dict[str, Any], department_id: str, corridor_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Normalizes Track Management System (Engineering) track assets.
    External raw attributes might include: track_id, track_name, wear_pct, km_marker, etc.
    """
    ext_id = str(raw.get("track_id") or raw.get("asset_code") or raw.get("id"))
    asset_code = raw.get("asset_code") or f"TRK-{ext_id}"
    health = float(raw.get("health") or raw.get("health_score") or (100.0 - float(raw.get("wear_pct", 15.0))))
    criticality = float(raw.get("criticality") or raw.get("criticality_score") or 75.0)

    return {
        "asset_code": asset_code,
        "asset_type": "TRACK",
        "department_id": department_id,
        "name": raw.get("name") or raw.get("track_name") or f"Track Section {asset_code}",
        "description": raw.get("location") or raw.get("description") or f"Km Marker {raw.get('km_marker', '0.0')}",
        "corridor_id": corridor_id or raw.get("corridor_id"),
        "latitude": raw.get("latitude"),
        "longitude": raw.get("longitude"),
        "health_score": min(max(health, 0.0), 100.0),
        "criticality_score": min(max(criticality, 0.0), 100.0),
        "status": raw.get("status", "HEALTHY" if health >= 70.0 else "MONITOR" if health >= 50.0 else "CRITICAL"),
        "external_source": "TMS",
        "external_id": ext_id,
        "extra_metadata": {"raw_payload": raw}
    }


def normalize_smms_asset(raw: Dict[str, Any], department_id: str, corridor_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Normalizes Signalling Maintenance & Management System assets.
    External raw attributes might include: signal_id, point_id, interlocking_code, etc.
    """
    ext_id = str(raw.get("signal_id") or raw.get("point_id") or raw.get("asset_code") or raw.get("id"))
    is_point = "POINT" in str(raw.get("type", "")).upper() or "P-" in ext_id or "point" in ext_id.lower()
    asset_type = "POINT_MACHINE" if is_point else "SIGNAL"
    asset_code = raw.get("asset_code") or (f"POINT-{ext_id}" if is_point else f"SIG-{ext_id}")
    health = float(raw.get("health") or raw.get("health_score") or 85.0)
    criticality = float(raw.get("criticality") or raw.get("criticality_score") or 80.0)

    return {
        "asset_code": asset_code,
        "asset_type": asset_type,
        "department_id": department_id,
        "name": raw.get("name") or f"Signal Asset {asset_code}",
        "description": raw.get("location") or raw.get("description") or "Signalling & Interlocking Apparatus",
        "corridor_id": corridor_id or raw.get("corridor_id"),
        "latitude": raw.get("latitude"),
        "longitude": raw.get("longitude"),
        "health_score": min(max(health, 0.0), 100.0),
        "criticality_score": min(max(criticality, 0.0), 100.0),
        "status": raw.get("status", "HEALTHY" if health >= 70.0 else "DEGRADED"),
        "external_source": "SMMS",
        "external_id": ext_id,
        "extra_metadata": {"raw_payload": raw}
    }


def normalize_tdms_asset(raw: Dict[str, Any], department_id: str, corridor_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Normalizes Traction Distribution Management System assets.
    External raw attributes might include: ohe_id, sub_id, feeder_no, tension_score, etc.
    """
    ext_id = str(raw.get("ohe_id") or raw.get("feeder_id") or raw.get("asset_code") or raw.get("id"))
    asset_type = "OHE" if "OHE" in ext_id.upper() else "TRANSFORMER" if "TR" in ext_id.upper() else "FEEDER"
    asset_code = raw.get("asset_code") or f"OHE-{ext_id}"
    health = float(raw.get("health") or raw.get("health_score") or 80.0)
    criticality = float(raw.get("criticality") or raw.get("criticality_score") or 90.0)

    return {
        "asset_code": asset_code,
        "asset_type": asset_type,
        "department_id": department_id,
        "name": raw.get("name") or f"Traction Asset {asset_code}",
        "description": raw.get("location") or raw.get("description") or "OHE 25kV Electrification Subsystem",
        "corridor_id": corridor_id or raw.get("corridor_id"),
        "latitude": raw.get("latitude"),
        "longitude": raw.get("longitude"),
        "health_score": min(max(health, 0.0), 100.0),
        "criticality_score": min(max(criticality, 0.0), 100.0),
        "status": raw.get("status", "HEALTHY"),
        "external_source": "TDMS",
        "external_id": ext_id,
        "extra_metadata": {"raw_payload": raw}
    }


def normalize_bdms_request(raw: Dict[str, Any], department_id: str, corridor_id: str) -> Dict[str, Any]:
    """
    Normalizes Block Demand Management System block requests.
    """
    ext_id = str(raw.get("request_id") or raw.get("id") or raw.get("demand_no"))
    req_code = raw.get("request_code") or f"REQ-{ext_id}"
    duration = int(raw.get("duration_minutes") or raw.get("duration") or 120)

    return {
        "request_code": req_code,
        "department_id": department_id,
        "corridor_id": corridor_id,
        "duration_minutes": duration,
        "reason": raw.get("reason") or raw.get("desc") or "Scheduled Engineering Track Maintenance",
        "priority": str(raw.get("priority", "HIGH")).upper(),
        "block_type": raw.get("block_type", "MAINTENANCE"),
        "isolation_required": bool(raw.get("isolation_required", False)),
        "requested_by_reference": raw.get("requested_by", "SYNTHETIC_BDMS_OFFICER"),
        "status": "SUBMITTED",
        "external_source": "BDMS",
        "external_id": ext_id
    }


def normalize_coa_train(raw: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalizes Control Office Application (COA) train records.
    """
    train_no = str(raw.get("train_no") or raw.get("train_number") or raw.get("id"))
    train_name = raw.get("name") or raw.get("train_name") or f"Express #{train_no}"
    train_type = str(raw.get("type") or raw.get("train_type") or "EXPRESS").upper()
    direction = str(raw.get("dir") or raw.get("direction") or "UP").upper()

    return {
        "train_number": train_no,
        "train_name": train_name,
        "train_type": train_type if train_type in ["PASSENGER", "EXPRESS", "SUPERFAST", "GOODS", "SPECIAL", "MAINTENANCE"] else "EXPRESS",
        "default_direction": direction if direction in ["UP", "DOWN"] else "UP",
        "origin": raw.get("origin", "STN-A"),
        "destination": raw.get("destination", "STN-E"),
        "priority": int(raw.get("priority", 2))
    }
