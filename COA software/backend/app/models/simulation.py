from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin, generate_uuid, utc_now

class SimulationScenario(Base, TimestampMixin):
    __tablename__ = "simulation_scenarios"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    scenario_type = Column(String(64), nullable=False) # PEAK_HOURS, SHADOW_BLOCK, DISRUPTION
    configuration = Column(JSON, nullable=True)
    created_by = Column(String(64), nullable=True)

    runs = relationship("SimulationRun", back_populates="scenario", cascade="all, delete-orphan")


class SimulationRun(Base):
    __tablename__ = "simulation_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    scenario_id = Column(String(36), ForeignKey("simulation_scenarios.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(32), default="INITIALIZING", nullable=False)
    simulation_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    simulation_time = Column(String(32), default="00:00:00", nullable=False)
    speed_multiplier = Column(Float, default=1.0, nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    scenario = relationship("SimulationScenario", back_populates="runs")
    events = relationship("SimulationEvent", back_populates="simulation_run", cascade="all, delete-orphan")


class SimulationEvent(Base):
    __tablename__ = "simulation_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    simulation_run_id = Column(String(36), ForeignKey("simulation_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(64), nullable=False)
    event_time = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    entity_type = Column(String(64), nullable=False)
    entity_id = Column(String(64), nullable=False)
    payload = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    simulation_run = relationship("SimulationRun", back_populates="events")
