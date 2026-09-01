import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON,
    UniqueConstraint, Index, CheckConstraint
)
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin, generate_uuid, utc_now

# =====================================================================
# ENUMS
# =====================================================================

class MaintenanceType(str, enum.Enum):
    PREVENTIVE = "PREVENTIVE"
    CORRECTIVE = "CORRECTIVE"
    INSPECTION = "INSPECTION"
    EMERGENCY = "EMERGENCY"
    OVERHAUL = "OVERHAUL"
    TESTING = "TESTING"

# Alias for backward compatibility
TaskTypeEnum = MaintenanceType

class MaintenanceStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    PENDING = "PENDING"
    OVERDUE = "OVERDUE"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

# Alias for backward compatibility
MaintenanceStatusEnum = MaintenanceStatus

class PriorityLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

# Alias for backward compatibility
PriorityEnum = PriorityLevel

# =====================================================================
# MAINTENANCE TASK & HISTORY MODELS
# =====================================================================

class MaintenanceTask(Base, TimestampMixin):
    __tablename__ = "maintenance_tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_code = Column(String(64), unique=True, nullable=False, index=True) # MT-0001
    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False, index=True)
    task_type = Column(String(32), default=MaintenanceType.PREVENTIVE, nullable=False)
    description = Column(Text, nullable=False)
    scheduled_start_at = Column(DateTime, nullable=True, index=True) # scheduled_date
    scheduled_end_at = Column(DateTime, nullable=True)
    due_at = Column(DateTime, nullable=True, index=True)             # due_date
    completion_at = Column(DateTime, nullable=True)                  # completion_date
    duration_minutes = Column(Integer, default=120, nullable=False)
    priority = Column(String(32), default=PriorityLevel.MEDIUM, nullable=False, index=True)
    criticality = Column(Float, default=50.0, nullable=False)
    urgency = Column(Float, default=50.0, nullable=False)
    safety_impact = Column(Float, default=50.0, nullable=False)
    train_impact = Column(Float, default=10.0, nullable=False)
    block_required = Column(Boolean, default=True, nullable=False, index=True)
    isolation_required = Column(Boolean, default=False, nullable=False)
    preferred_start_at = Column(DateTime, nullable=True)
    preferred_end_at = Column(DateTime, nullable=True)
    status = Column(String(32), default=MaintenanceStatus.PLANNED, nullable=False, index=True)
    assigned_team = Column(String(64), nullable=True)
    external_source = Column(String(32), nullable=True)
    external_id = Column(String(128), nullable=True)
    extra_metadata = Column(JSON, nullable=True)

    __table_args__ = (
        UniqueConstraint("external_source", "external_id", name="uq_maintenance_external_source_id"),
        Index("ix_maint_tasks_asset_dept_status", "asset_id", "department_id", "status"),
        Index("ix_maint_tasks_scheduled_start_at", "scheduled_start_at"),
        Index("ix_maint_tasks_due_at", "due_at"),
        CheckConstraint("duration_minutes > 0", name="chk_maint_duration_positive"),
        CheckConstraint("criticality >= 0 AND criticality <= 100", name="chk_maint_criticality_range"),
        CheckConstraint("urgency >= 0 AND urgency <= 100", name="chk_maint_urgency_range"),
        CheckConstraint("safety_impact >= 0 AND safety_impact <= 100", name="chk_maint_safety_range"),
        CheckConstraint("train_impact >= 0 AND train_impact <= 100", name="chk_maint_train_impact_range"),
    )

    asset = relationship("Asset", back_populates="maintenance_tasks")
    department = relationship("Department", back_populates="maintenance_tasks")
    block_tasks = relationship("BlockTask", back_populates="maintenance_task")
    history = relationship("MaintenanceHistory", back_populates="maintenance_task", cascade="all, delete-orphan")

    # Backward compatibility properties
    @property
    def is_overdue(self) -> bool:
        if self.status in [MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED]:
            return False
        if self.due_at and self.due_at < datetime.now(timezone.utc).replace(tzinfo=None):
            return True
        return self.status == MaintenanceStatus.OVERDUE

    @property
    def overdue_days(self) -> int:
        now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
        if self.due_at and now_naive > self.due_at:
            return (now_naive - self.due_at).days
        return 0

    @property
    def scheduled_date(self) -> datetime:
        return self.scheduled_start_at

    @property
    def due_date(self) -> datetime:
        return self.due_at

    @property
    def completion_date(self) -> datetime:
        return self.completion_at

    @property
    def preferred_start(self) -> datetime:
        return self.preferred_start_at

    @property
    def preferred_end(self) -> datetime:
        return self.preferred_end_at


class MaintenanceHistory(Base):
    __tablename__ = "maintenance_history"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    maintenance_task_id = Column(String(36), ForeignKey("maintenance_tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    performed_by = Column(String(64), nullable=True)
    status = Column(String(32), default="COMPLETED", nullable=False)
    event_type = Column(String(64), default="MAINTENANCE_RECORD", nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    remarks = Column(Text, nullable=True)
    result = Column(String(64), nullable=True) # SUCCESS, PARTIAL, ABORTED
    event_time = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    maintenance_task = relationship("MaintenanceTask", back_populates="history")
    asset = relationship("Asset")
