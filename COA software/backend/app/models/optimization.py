from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base, generate_uuid, utc_now

class OptimizationRun(Base):
    __tablename__ = "optimization_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    run_code = Column(String(64), unique=True, nullable=True)
    planning_horizon = Column(String(32), default="DAILY", nullable=False)
    corridor_id = Column(String(36), ForeignKey("corridors.id", ondelete="SET NULL"), nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String(32), default="PENDING", nullable=False)
    objective_config = Column(JSON, nullable=True)
    constraint_config = Column(JSON, nullable=True)
    solver_name = Column(String(64), default="OR_TOOLS_CP_SAT", nullable=False)
    solver_version = Column(String(32), default="9.15", nullable=False)
    created_by = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    results = relationship("OptimizationResult", back_populates="optimization_run", cascade="all, delete-orphan")


class OptimizationResult(Base):
    __tablename__ = "optimization_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    optimization_run_id = Column(String(36), ForeignKey("optimization_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    block_plan_id = Column(String(36), ForeignKey("block_plans.id", ondelete="CASCADE"), nullable=False)
    optimization_score = Column(Float, nullable=True)
    maintenance_priority_coverage = Column(Float, nullable=True)
    asset_availability_gain = Column(Float, nullable=True)
    train_delay = Column(Float, nullable=True)
    downtime_reduction = Column(Float, nullable=True)
    shared_block_bonus = Column(Float, nullable=True)
    result_explanation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    optimization_run = relationship("OptimizationRun", back_populates="results")
    block_plan = relationship("BlockPlan")

    @property
    def rank(self) -> int:
        return 1

    @property
    def objective_value(self) -> float:
        return self.optimization_score or 0.0
