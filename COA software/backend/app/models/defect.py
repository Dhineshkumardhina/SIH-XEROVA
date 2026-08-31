import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, DateTime, ForeignKey, Text, JSON,
    UniqueConstraint, Index, CheckConstraint
)
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin, generate_uuid

# =====================================================================
# ENUMS
# =====================================================================

class DefectSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

# Alias for backward compatibility
DefectSeverityEnum = DefectSeverity

class DefectStatus(str, enum.Enum):
    OPEN = "OPEN"
    UNDER_REVIEW = "UNDER_REVIEW"
    ASSIGNED = "ASSIGNED"
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"

# =====================================================================
# DEFECT MODEL
# =====================================================================

class Defect(Base, TimestampMixin):
    __tablename__ = "defects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    defect_code = Column(String(64), unique=True, nullable=False, index=True) # DEF-0001
    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False, index=True)
    description = Column(Text, nullable=False)
    severity = Column(String(32), default=DefectSeverity.HIGH, nullable=False, index=True)
    detected_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True) # detected_date
    detected_by = Column(String(64), default="INSPECTION_SYSTEM", nullable=False)
    risk_score = Column(Float, default=70.0, nullable=False, index=True) # 0-100
    safety_impact = Column(Float, default=50.0, nullable=False)          # 0-100
    operational_impact = Column(Float, default=50.0, nullable=False)     # 0-100
    status = Column(String(32), default=DefectStatus.OPEN, nullable=False, index=True)
    target_resolution_date = Column(DateTime, nullable=True, index=True)
    resolved_at = Column(DateTime, nullable=True)
    assigned_to = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    resolved_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    external_source = Column(String(32), nullable=True)
    external_id = Column(String(128), nullable=True)
    extra_metadata = Column(JSON, nullable=True)

    __table_args__ = (
        UniqueConstraint("external_source", "external_id", name="uq_defect_external_source_id"),
        Index("ix_defects_asset_severity_status", "asset_id", "severity", "status"),
        CheckConstraint("risk_score >= 0 AND risk_score <= 100", name="chk_defect_risk_range"),
        CheckConstraint("safety_impact >= 0 AND safety_impact <= 100", name="chk_defect_safety_range"),
        CheckConstraint("operational_impact >= 0 AND operational_impact <= 100", name="chk_defect_operational_range"),
    )

    asset = relationship("Asset", back_populates="defects")
    department = relationship("Department", back_populates="defects")

    # Backward compatibility properties
    @property
    def detected_date(self) -> datetime:
        return self.detected_at

    @property
    def detected_by_reference(self) -> str:
        return self.detected_by
