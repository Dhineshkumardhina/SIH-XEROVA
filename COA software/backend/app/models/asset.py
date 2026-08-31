import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON,
    UniqueConstraint, Index, CheckConstraint
)
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin, generate_uuid

# =====================================================================
# ENUMS
# =====================================================================

class AssetType(str, enum.Enum):
    TRACK = "TRACK"
    SIGNAL = "SIGNAL"
    TELECOM = "TELECOM"
    OHE = "OHE"
    FEEDER = "FEEDER"
    TRANSFORMER = "TRANSFORMER"
    SUBSTATION = "SUBSTATION"
    POINT_MACHINE = "POINT_MACHINE"
    LEVEL_CROSSING = "LEVEL_CROSSING"
    OTHER = "OTHER"

# Alias for backward compatibility
AssetTypeEnum = AssetType

class AssetStatus(str, enum.Enum):
    HEALTHY = "HEALTHY"
    MONITOR = "MONITOR"
    DEGRADED = "DEGRADED"
    CRITICAL = "CRITICAL"
    OUT_OF_SERVICE = "OUT_OF_SERVICE"

# Alias for backward compatibility
AssetStatusEnum = AssetStatus

# =====================================================================
# CENTRAL ASSET MODEL
# =====================================================================

class Asset(Base, TimestampMixin):
    __tablename__ = "assets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    asset_code = Column(String(64), unique=True, nullable=False, index=True)
    asset_type = Column(String(32), nullable=False, index=True)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False, index=True)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True) # location_description
    station_id = Column(String(36), ForeignKey("stations.id", ondelete="SET NULL"), nullable=True, index=True)
    corridor_id = Column(String(36), ForeignKey("corridors.id", ondelete="SET NULL"), nullable=True, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    installation_date = Column(DateTime, nullable=True)
    commission_date = Column(DateTime, nullable=True)
    criticality_score = Column(Float, default=50.0, nullable=False, index=True) # 0-100
    health_score = Column(Float, default=85.0, nullable=False)                 # 0-100
    last_inspection_at = Column(DateTime, nullable=True)
    next_inspection_at = Column(DateTime, nullable=True)
    maintenance_due_at = Column(DateTime, nullable=True)
    status = Column(String(32), default=AssetStatus.HEALTHY, nullable=False, index=True)
    external_source = Column(String(32), nullable=True) # TMS, SMMS, TDMS
    external_id = Column(String(128), nullable=True)
    extra_metadata = Column(JSON, nullable=True)

    __table_args__ = (
        UniqueConstraint("external_source", "external_id", name="uq_asset_external_source_id"),
        Index("ix_assets_composite_dept_corridor", "department_id", "corridor_id"),
        CheckConstraint("criticality_score >= 0 AND criticality_score <= 100", name="chk_asset_criticality_range"),
        CheckConstraint("health_score >= 0 AND health_score <= 100", name="chk_asset_health_range"),
    )

    department = relationship("Department", back_populates="assets")
    station = relationship("Station", back_populates="assets")
    corridor = relationship("Corridor", back_populates="assets")
    health_history = relationship("AssetHealth", back_populates="asset", cascade="all, delete-orphan")
    inspections = relationship("Inspection", back_populates="asset", cascade="all, delete-orphan")
    maintenance_tasks = relationship("MaintenanceTask", back_populates="asset")
    defects = relationship("Defect", back_populates="asset")

    # 1-to-1 Specialized asset relationships
    track_details = relationship("TrackAsset", back_populates="asset", uselist=False, cascade="all, delete-orphan")
    signal_details = relationship("SignalAsset", back_populates="asset", uselist=False, cascade="all, delete-orphan")
    telecom_details = relationship("TelecomAsset", back_populates="asset", uselist=False, cascade="all, delete-orphan")
    ohe_details = relationship("OHEAsset", back_populates="asset", uselist=False, cascade="all, delete-orphan")
    feeder_details = relationship("Feeder", back_populates="asset", uselist=False, cascade="all, delete-orphan")
    transformer_details = relationship("Transformer", back_populates="asset", uselist=False, cascade="all, delete-orphan")
    substation_details = relationship("Substation", back_populates="asset", uselist=False, cascade="all, delete-orphan")
    point_details = relationship("PointMachine", back_populates="asset", uselist=False, cascade="all, delete-orphan")

    # Backward compatibility properties
    @property
    def location_description(self) -> str:
        return self.description or ""

    @property
    def location(self) -> str:
        return self.description or (f"Station {self.station.code}" if self.station else "Corridor Section")

    @property
    def last_inspection(self) -> datetime:
        return self.last_inspection_at

    @property
    def next_inspection(self) -> datetime:
        return self.next_inspection_at

    @property
    def maintenance_due_date(self) -> datetime:
        return self.maintenance_due_at

    @property
    def department_code(self) -> str:
        return self.department.code if self.department else ""


# =====================================================================
# SPECIALIZED ASSET TABLES (Section 14)
# =====================================================================

class TrackAsset(Base):
    __tablename__ = "track_assets"

    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), primary_key=True)
    kilometer_from = Column(Float, nullable=False, default=0.0)
    kilometer_to = Column(Float, nullable=False, default=1.0)
    track_type = Column(String(64), default="MAIN_LINE", nullable=False) # MAIN_LINE, LOOP_LINE, SIDING
    condition = Column(String(32), default="GOOD", nullable=False)

    asset = relationship("Asset", back_populates="track_details")


class SignalAsset(Base):
    __tablename__ = "signal_assets"

    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), primary_key=True)
    signal_type = Column(String(64), default="MULTI_ASPECT_COLOR_LIGHT", nullable=False)
    failure_count = Column(Integer, default=0, nullable=False)
    condition = Column(String(32), default="NORMAL", nullable=False)

    asset = relationship("Asset", back_populates="signal_details")


class TelecomAsset(Base):
    __tablename__ = "telecom_assets"

    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), primary_key=True)
    system_type = Column(String(64), default="OPTICAL_FIBER_CABLE", nullable=False)
    condition = Column(String(32), default="OPERATIONAL", nullable=False)

    asset = relationship("Asset", back_populates="telecom_details")


class OHEAsset(Base):
    __tablename__ = "ohe_assets"

    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), primary_key=True)
    voltage = Column(Float, default=25.0, nullable=False) # 25kV AC
    isolation_required = Column(Boolean, default=True, nullable=False)
    condition = Column(String(32), default="INTACT", nullable=False)

    asset = relationship("Asset", back_populates="ohe_details")


class Feeder(Base):
    __tablename__ = "feeders"

    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), primary_key=True)
    voltage = Column(Float, default=25.0, nullable=False)
    capacity = Column(Float, default=100.0, nullable=False) # MVA
    isolation_required = Column(Boolean, default=True, nullable=False)

    asset = relationship("Asset", back_populates="feeder_details")


class Transformer(Base):
    __tablename__ = "transformers"

    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), primary_key=True)
    rating = Column(String(64), default="21.6/30.24 MVA", nullable=False)
    condition = Column(String(32), default="OPERATIONAL", nullable=False)

    asset = relationship("Asset", back_populates="transformer_details")


class Substation(Base):
    __tablename__ = "substations"

    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), primary_key=True)
    capacity = Column(Float, default=50.0, nullable=False) # MW
    condition = Column(String(32), default="ENERGIZED", nullable=False)

    asset = relationship("Asset", back_populates="substation_details")


class PointMachine(Base):
    __tablename__ = "point_machines"

    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), primary_key=True)
    point_type = Column(String(64), default="ROTARY_TYPE_143MM", nullable=False)
    condition = Column(String(32), default="LOCKED_NORMAL", nullable=False)

    asset = relationship("Asset", back_populates="point_details")
