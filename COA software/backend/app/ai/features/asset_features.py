from datetime import datetime, timezone
from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.models.asset import Asset
from app.models.defect import Defect, DefectStatus, DefectSeverity
from app.models.maintenance import MaintenanceTask, MaintenanceHistory, MaintenanceStatus
from app.models.inspection import Inspection


@dataclass
class AssetRiskFeatures:
    asset_id: str
    asset_code: str
    asset_type: str
    department_code: str
    corridor_id: Optional[str]
    
    asset_age: float
    asset_age_score: float
    health_score: float
    health_risk: float
    failure_count: int
    failure_history_score: float
    defect_count: int
    defect_risk: float
    overdue_days: int
    overdue_risk: float
    inspection_score: float
    inspection_risk: float
    criticality: float
    usage_risk: float
    
    horizon_days: int = 30
    inspection_available: bool = True

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def calculate_asset_age(asset: Asset) -> tuple[float, float]:
    """Returns (age_in_years, age_score_0_to_100)"""
    now = datetime.utcnow()
    ref_date = asset.commission_date or asset.installation_date
    if not ref_date:
        # Default representative baseline age if date not populated
        age_years = 10.0
    else:
        ref_naive = ref_date.replace(tzinfo=None)
        age_years = max(0.0, (now - ref_naive).days / 365.25)
    
    # 0 to 25+ years mapped to 0-100 scale (e.g. 25 years = 100 score)
    age_score = min(100.0, max(0.0, (age_years / 25.0) * 100.0))
    return round(age_years, 1), round(age_score, 1)


def calculate_health_risk(asset: Asset) -> tuple[float, float]:
    """Returns (health_score, health_risk_0_to_100)"""
    h_score = float(asset.health_score if asset.health_score is not None else 75.0)
    h_score = min(100.0, max(0.0, h_score))
    health_risk = 100.0 - h_score
    return round(h_score, 1), round(health_risk, 1)


def calculate_failure_history_score(asset: Asset, db: Session) -> tuple[int, float]:
    """Calculates historical failure count & failure risk score (0-100)"""
    # Count failed/aborted/emergency records in maintenance history
    hist_count = db.scalar(
        select(func.count(MaintenanceHistory.id))
        .where(
            MaintenanceHistory.asset_id == asset.id,
            MaintenanceHistory.result.in_(["PARTIAL", "ABORTED", "FAILURE"])
        )
    ) or 0

    # Count emergency maintenance tasks
    emergency_count = db.scalar(
        select(func.count(MaintenanceTask.id))
        .where(
            MaintenanceTask.asset_id == asset.id,
            MaintenanceTask.task_type == "EMERGENCY"
        )
    ) or 0

    # Specialized signal failure count if applicable
    specialized_count = 0
    if hasattr(asset, "signal_details") and asset.signal_details:
        specialized_count = asset.signal_details.failure_count or 0

    total_failures = hist_count + emergency_count + specialized_count

    # Normalized score: 0=0, 1=30, 2=55, 3=75, 4=90, 5+=100
    if total_failures == 0:
        score = 0.0
    elif total_failures == 1:
        score = 30.0
    elif total_failures == 2:
        score = 55.0
    elif total_failures == 3:
        score = 75.0
    elif total_failures == 4:
        score = 90.0
    else:
        score = 100.0

    return int(total_failures), score


def calculate_defect_score(asset: Asset, db: Session) -> tuple[int, float]:
    """Calculates open defects count and weighted severity risk (0-100)"""
    open_statuses = [
        DefectStatus.OPEN.value if hasattr(DefectStatus.OPEN, "value") else "OPEN",
        "UNDER_REVIEW", "ASSIGNED", "SCHEDULED", "IN_PROGRESS"
    ]
    
    defects = list(db.scalars(
        select(Defect)
        .where(
            Defect.asset_id == asset.id,
            Defect.status.in_(open_statuses)
        )
    ))

    count = len(defects)
    if count == 0:
        return 0, 0.0

    # Weighted defect calculation
    severity_weights = {
        "CRITICAL": 100.0,
        "HIGH": 75.0,
        "MEDIUM": 45.0,
        "LOW": 20.0
    }

    max_sev = 0.0
    sum_sev = 0.0
    for d in defects:
        sev_str = (d.severity or "MEDIUM").upper()
        w = severity_weights.get(sev_str, 45.0)
        sum_sev += w
        if w > max_sev:
            max_sev = w

    # Score is bounded combination of max severity + accumulation
    accumulated = max_sev + min(25.0, (count - 1) * 8.0)
    score = min(100.0, max(0.0, accumulated))
    return count, round(score, 1)


def calculate_overdue_score(asset: Asset, db: Session) -> tuple[int, float]:
    """Calculates max overdue days and overdue risk score (0-100)"""
    now = datetime.utcnow()
    tasks = list(db.scalars(
        select(MaintenanceTask)
        .where(
            MaintenanceTask.asset_id == asset.id,
            MaintenanceTask.status.notin_(["COMPLETED", "CANCELLED"])
        )
    ))

    max_overdue_days = 0
    for t in tasks:
        if t.due_at:
            due_naive = t.due_at.replace(tzinfo=None)
            if now > due_naive:
                days = (now - due_naive).days
                if days > max_overdue_days:
                    max_overdue_days = days
        elif t.status == MaintenanceStatus.OVERDUE:
            max_overdue_days = max(max_overdue_days, 7)

    # 0 days: 0, 1-3: 25, 4-7: 50, 8-14: 75, 15+: 100
    if max_overdue_days == 0:
        risk = 0.0
    elif max_overdue_days <= 3:
        risk = 25.0
    elif max_overdue_days <= 7:
        risk = 50.0
    elif max_overdue_days <= 14:
        risk = 75.0
    else:
        risk = 100.0

    return max_overdue_days, risk


def calculate_inspection_score(asset: Asset, db: Session) -> tuple[float, float, bool]:
    """Returns (inspection_score, inspection_risk_0_to_100, is_available)"""
    latest_insp = db.scalar(
        select(Inspection)
        .where(Inspection.asset_id == asset.id)
        .order_by(Inspection.inspection_date.desc())
    )

    if not latest_insp:
        # Fallback if no inspection recorded: moderate default
        return 65.0, 35.0, False

    cond_score = float(latest_insp.condition_score if latest_insp.condition_score is not None else 70.0)
    cond_score = min(100.0, max(0.0, cond_score))
    insp_risk = 100.0 - cond_score

    # Check if next inspection is overdue
    if latest_insp.next_inspection_date:
        now = datetime.utcnow()
        next_naive = latest_insp.next_inspection_date.replace(tzinfo=None)
        if now > next_naive:
            overdue_insp_days = (now - next_naive).days
            insp_risk = min(100.0, insp_risk + min(30.0, overdue_insp_days * 2.0))

    return round(cond_score, 1), round(insp_risk, 1), True


def calculate_criticality_score(asset: Asset) -> float:
    """Returns asset criticality score (0-100)"""
    crit = float(asset.criticality_score if asset.criticality_score is not None else 50.0)
    return round(min(100.0, max(0.0, crit)), 1)


def calculate_usage_score(asset: Asset, db: Session) -> float:
    """Estimates usage/load proxy based on asset type and corridor context"""
    base_usage = 50.0
    a_type = (asset.asset_type or "TRACK").upper()

    if a_type in ["TRACK", "POINT_MACHINE", "LEVEL_CROSSING"]:
        base_usage = 70.0
    elif a_type in ["OHE", "SUBSTATION", "TRANSFORMER"]:
        base_usage = 65.0
    elif a_type in ["SIGNAL"]:
        base_usage = 60.0
    else:
        base_usage = 45.0

    return base_usage


def extract_asset_risk_features(asset: Asset, db: Session, horizon_days: int = 30) -> AssetRiskFeatures:
    """Extracts and normalizes all asset risk features into a unified object"""
    age_years, age_score = calculate_asset_age(asset)
    h_score, h_risk = calculate_health_risk(asset)
    fail_count, fail_score = calculate_failure_history_score(asset, db)
    def_count, def_risk = calculate_defect_score(asset, db)
    overdue_days, overdue_risk = calculate_overdue_score(asset, db)
    insp_score, insp_risk, insp_avail = calculate_inspection_score(asset, db)
    criticality = calculate_criticality_score(asset)
    usage_risk = calculate_usage_score(asset, db)

    dept_code = asset.department.code if asset.department else "ENG"

    return AssetRiskFeatures(
        asset_id=asset.id,
        asset_code=asset.asset_code,
        asset_type=asset.asset_type,
        department_code=dept_code,
        corridor_id=asset.corridor_id,
        asset_age=age_years,
        asset_age_score=age_score,
        health_score=h_score,
        health_risk=h_risk,
        failure_count=fail_count,
        failure_history_score=fail_score,
        defect_count=def_count,
        defect_risk=def_risk,
        overdue_days=overdue_days,
        overdue_risk=overdue_risk,
        inspection_score=insp_score,
        inspection_risk=insp_risk,
        criticality=criticality,
        usage_risk=usage_risk,
        horizon_days=horizon_days,
        inspection_available=insp_avail
    )
