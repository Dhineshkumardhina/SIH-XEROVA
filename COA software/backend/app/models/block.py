import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text,
    UniqueConstraint, Index, CheckConstraint
)
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin, generate_uuid, utc_now

# =====================================================================
# ENUMS
# =====================================================================

class BlockRequestStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    AI_ANALYZED = "AI_ANALYZED"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

# Alias for backward compatibility
BlockStatusEnum = BlockRequestStatus

class ConflictType(str, enum.Enum):
    TRAIN_CONFLICT = "TRAIN_CONFLICT"
    BLOCK_OVERLAP = "BLOCK_OVERLAP"
    CORRIDOR_CONFLICT = "CORRIDOR_CONFLICT"
    ISOLATION_CONFLICT = "ISOLATION_CONFLICT"
    DEPARTMENT_CONFLICT = "DEPARTMENT_CONFLICT"
    SAFETY_CONFLICT = "SAFETY_CONFLICT"
    MAINTENANCE_CONFLICT = "MAINTENANCE_CONFLICT"
    CAPACITY_CONFLICT = "CAPACITY_CONFLICT"
    OPERATIONAL_BUFFER_CONFLICT = "OPERATIONAL_BUFFER_CONFLICT"

# Alias for backward compatibility
ConflictTypeEnum = ConflictType

class BlockApprovalAction(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    MODIFIED = "MODIFIED"

# Alias for backward compatibility
BlockApprovalActionEnum = BlockApprovalAction

# =====================================================================
# BLOCK MODELS
# =====================================================================

class BlockRequest(Base, TimestampMixin):
    __tablename__ = "block_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    request_code = Column(String(64), unique=True, nullable=False, index=True)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False, index=True)
    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="SET NULL"), nullable=True, index=True)
    corridor_id = Column(String(36), ForeignKey("corridors.id", ondelete="RESTRICT"), nullable=False, index=True)
    requested_date = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    preferred_start_at = Column(DateTime, nullable=False)
    preferred_end_at = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    block_type = Column(String(32), default="MAINTENANCE", nullable=False)
    isolation_required = Column(Boolean, default=False, nullable=False)
    reason = Column(Text, nullable=False)
    priority = Column(String(32), default="HIGH", nullable=False, index=True)
    requested_by = Column(String(64), nullable=False)
    status = Column(String(32), default=BlockRequestStatus.SUBMITTED, nullable=False, index=True)
    external_source = Column(String(32), nullable=True)
    external_id = Column(String(128), nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    reviewed_by = Column(String(64), nullable=True)
    approved_by = Column(String(64), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint("external_source", "external_id", name="uq_block_request_external_source_id"),
        CheckConstraint("duration_minutes > 0", name="chk_block_request_duration_positive"),
    )

    department = relationship("Department", back_populates="block_requests")
    asset = relationship("Asset")
    corridor = relationship("Corridor", back_populates="block_requests")
    request_tasks = relationship("BlockRequestTask", back_populates="block_request", cascade="all, delete-orphan")

    @property
    def preferred_start(self) -> datetime:
        return self.preferred_start_at

    @preferred_start.setter
    def preferred_start(self, value: datetime) -> None:
        self.preferred_start_at = value

    @property
    def preferred_end(self) -> datetime:
        return self.preferred_end_at

    @preferred_end.setter
    def preferred_end(self, value: datetime) -> None:
        self.preferred_end_at = value

    @property
    def requested_by_reference(self) -> str:
        return self.requested_by

    @requested_by_reference.setter
    def requested_by_reference(self, value: str) -> None:
        self.requested_by = value

class BlockRequestTask(Base):
    __tablename__ = "block_request_tasks"

    block_request_id = Column(String(36), ForeignKey("block_requests.id", ondelete="CASCADE"), primary_key=True)
    maintenance_task_id = Column(String(36), ForeignKey("maintenance_tasks.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    block_request = relationship("BlockRequest", back_populates="request_tasks")
    maintenance_task = relationship("MaintenanceTask")

class BlockPlan(Base, TimestampMixin):
    __tablename__ = "block_plans"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    plan_code = Column(String(64), unique=True, nullable=False, index=True)
    corridor_id = Column(String(36), ForeignKey("corridors.id", ondelete="RESTRICT"), nullable=False, index=True)
    planning_date = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    planned_start_at = Column(DateTime, nullable=False) # start_time
    planned_end_at = Column(DateTime, nullable=False)   # end_time
    duration_minutes = Column(Integer, nullable=False)
    status = Column(String(32), default=BlockRequestStatus.DRAFT, nullable=False, index=True)
    planning_horizon = Column(String(32), default="DAILY", nullable=False)
    optimization_score = Column(Float, nullable=True)
    expected_train_delay = Column(Integer, default=0, nullable=True)
    asset_availability_gain = Column(Float, default=0.0, nullable=True)
    generated_by = Column(String(64), nullable=True)
    approved_by = Column(String(64), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    published_by = Column(String(64), nullable=True)
    published_at = Column(DateTime, nullable=True)
    version = Column(Integer, default=1, nullable=False)
    change_reason = Column(String(255), nullable=True)
    previous_version_id = Column(String(36), ForeignKey("block_plans.id", ondelete="SET NULL"), nullable=True)
    weekly_plan_id = Column(String(64), nullable=True)
    monthly_plan_id = Column(String(64), nullable=True)

    __table_args__ = (
        CheckConstraint("duration_minutes > 0", name="chk_block_plan_duration_positive"),
    )

    corridor = relationship("Corridor", back_populates="block_plans")
    block_tasks = relationship("BlockTask", back_populates="block_plan", cascade="all, delete-orphan")
    conflicts = relationship("BlockConflict", foreign_keys="[BlockConflict.block_plan_id]", back_populates="block_plan", cascade="all, delete-orphan")
    approvals = relationship("BlockApproval", back_populates="block_plan", cascade="all, delete-orphan")

    @property
    def start_time(self) -> datetime:
        return self.planned_start_at

    @property
    def end_time(self) -> datetime:
        return self.planned_end_at

    @property
    def expected_train_delay_minutes(self) -> int:
        return self.expected_train_delay or 0

    @property
    def created_by(self) -> str:
        return self.generated_by or ""

    @created_by.setter
    def created_by(self, value: str) -> None:
        self.generated_by = value

    @property
    def tasks_included(self) -> list:
        return [bt.maintenance_task.task_code if bt.maintenance_task else bt.maintenance_task_id for bt in self.block_tasks]

    @property
    def departments(self) -> list:
        depts = set()
        for bt in self.block_tasks:
            if bt.maintenance_task and bt.maintenance_task.department:
                depts.add(bt.maintenance_task.department.code)
        return list(depts)

    @property
    def train_impact(self) -> int:
        return self.expected_train_delay or 0

    @property
    def downtime_saved_minutes(self) -> int:
        return int((self.asset_availability_gain or 0.0) * 10)


class BlockTask(Base):
    """
    Junction Table: BlockTask
    Enables many maintenance tasks to belong to one block plan.
    Section 22: Composite primary key (block_plan_id, maintenance_task_id)
    """
    __tablename__ = "block_tasks"

    block_plan_id = Column(String(36), ForeignKey("block_plans.id", ondelete="CASCADE"), primary_key=True)
    maintenance_task_id = Column(String(36), ForeignKey("maintenance_tasks.id", ondelete="CASCADE"), primary_key=True)
    sequence_order = Column(Integer, default=1, nullable=False)
    planned_duration_minutes = Column(Integer, default=60, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    block_plan = relationship("BlockPlan", back_populates="block_tasks")
    maintenance_task = relationship("MaintenanceTask", back_populates="block_tasks")


class BlockConflict(Base, TimestampMixin):
    __tablename__ = "block_conflicts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    block_plan_id = Column(String(36), ForeignKey("block_plans.id", ondelete="CASCADE"), nullable=True, index=True)
    block_request_id = Column(String(36), ForeignKey("block_requests.id", ondelete="CASCADE"), nullable=True, index=True)
    corridor_id = Column(String(36), ForeignKey("corridors.id", ondelete="SET NULL"), nullable=True, index=True)
    conflict_type = Column(String(32), nullable=False, index=True)
    severity = Column(String(32), default="HIGH", nullable=False, index=True)
    entity_type = Column(String(32), nullable=True)
    entity_id = Column(String(128), nullable=True)
    start_time = Column(DateTime, nullable=True, index=True)
    end_time = Column(DateTime, nullable=True)
    description = Column(Text, nullable=False)
    resolution_suggestion = Column(Text, nullable=True)
    related_train_id = Column(String(36), ForeignKey("trains.id", ondelete="SET NULL"), nullable=True)
    related_block_id = Column(String(36), ForeignKey("block_plans.id", ondelete="SET NULL"), nullable=True)
    resolved = Column(Boolean, default=False, nullable=False, index=True)
    resolution_notes = Column(Text, nullable=True)
    detected_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    block_plan = relationship("BlockPlan", foreign_keys=[block_plan_id], back_populates="conflicts")
    block_request = relationship("BlockRequest", foreign_keys=[block_request_id])
    corridor = relationship("Corridor", foreign_keys=[corridor_id])
    related_train = relationship("Train", foreign_keys=[related_train_id])
    related_block_plan = relationship("BlockPlan", foreign_keys=[related_block_id])

    @property
    def related_block_plan_id(self) -> str:
        return self.related_block_id

    @property
    def is_resolved(self) -> bool:
        return self.resolved

    @is_resolved.setter
    def is_resolved(self, val: bool) -> None:
        self.resolved = val

    @property
    def status(self) -> str:
        return "RESOLVED" if self.resolved else "DETECTED"


class BlockApproval(Base):
    __tablename__ = "block_approvals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    block_plan_id = Column(String(36), ForeignKey("block_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    approved_by = Column(String(64), nullable=False) # actor_reference
    action = Column(String(32), nullable=False)      # APPROVED, REJECTED, MODIFIED
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    block_plan = relationship("BlockPlan", back_populates="approvals")

    @property
    def actor_reference(self) -> str:
        return self.approved_by

    @actor_reference.setter
    def actor_reference(self, value: str) -> None:
        self.approved_by = value

    @property
    def comment(self) -> str:
        return self.comments or ""

    @comment.setter
    def comment(self, value: str) -> None:
        self.comments = value

    @property
    def action_at(self) -> datetime:
        return self.created_at
