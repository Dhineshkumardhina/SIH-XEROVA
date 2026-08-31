import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, DateTime, ForeignKey, Index, CheckConstraint
)
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin, generate_uuid, utc_now

# =====================================================================
# ENUMS
# =====================================================================

class TrainType(str, enum.Enum):
    PASSENGER = "PASSENGER"
    EXPRESS = "EXPRESS"
    SUPERFAST = "SUPERFAST"
    GOODS = "GOODS"
    SPECIAL = "SPECIAL"
    MAINTENANCE = "MAINTENANCE"

TrainTypeEnum = TrainType

class TrainDirection(str, enum.Enum):
    UP = "UP"
    DOWN = "DOWN"

TrainDirectionEnum = TrainDirection

class TrainStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    APPROACHING = "APPROACHING"
    AT_STATION = "AT_STATION"
    DEPARTED = "DEPARTED"
    DELAYED = "DELAYED"
    CANCELLED = "CANCELLED"

# =====================================================================
# TRAIN MODELS
# =====================================================================

class Train(Base, TimestampMixin):
    __tablename__ = "trains"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    train_number = Column(String(32), unique=True, nullable=False, index=True)
    train_name = Column(String(128), nullable=False)
    train_type = Column(String(32), default=TrainType.EXPRESS, nullable=False)
    default_direction = Column(String(16), default=TrainDirection.UP, nullable=False)
    origin = Column(String(64), nullable=False, default="STN-A")
    destination = Column(String(64), nullable=False, default="STN-C")
    priority = Column(Integer, default=1, nullable=False)
    status = Column(String(32), default=TrainStatus.SCHEDULED, nullable=False, index=True)
    corridor_id = Column(String(36), ForeignKey("corridors.id", ondelete="SET NULL"), nullable=True, index=True)

    corridor = relationship("Corridor")
    schedules = relationship("TrainSchedule", back_populates="train", cascade="all, delete-orphan")
    movements = relationship("TrainMovement", back_populates="train", cascade="all, delete-orphan")

    @property
    def direction(self) -> str:
        return self.default_direction

    @property
    def is_goods_train(self) -> bool:
        return self.train_type == TrainType.GOODS

    @property
    def is_passenger_train(self) -> bool:
        return self.train_type in [TrainType.PASSENGER, TrainType.EXPRESS, TrainType.SUPERFAST]


class TrainSchedule(Base):
    __tablename__ = "train_schedules"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    train_id = Column(String(36), ForeignKey("trains.id", ondelete="CASCADE"), nullable=False, index=True)
    station_id = Column(String(36), ForeignKey("stations.id", ondelete="SET NULL"), nullable=True, index=True)
    corridor_id = Column(String(36), ForeignKey("corridors.id", ondelete="SET NULL"), nullable=True, index=True)
    scheduled_date = Column(DateTime, nullable=True, index=True)
    arrival_time = Column(DateTime, nullable=True, index=True)
    departure_time = Column(DateTime, nullable=True, index=True)
    line = Column(String(32), default="MAIN_1", nullable=True)
    road = Column(String(32), nullable=True)
    direction = Column(String(16), nullable=True)
    sequence_number = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    __table_args__ = (
        Index("ix_schedules_train_station_date", "train_id", "station_id", "scheduled_date"),
    )

    train = relationship("Train", back_populates="schedules")
    station = relationship("Station")
    corridor = relationship("Corridor")


class TrainMovement(Base):
    __tablename__ = "train_movements"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    train_id = Column(String(36), ForeignKey("trains.id", ondelete="CASCADE"), nullable=False, index=True)
    corridor_id = Column(String(36), ForeignKey("corridors.id", ondelete="SET NULL"), nullable=True, index=True)
    station_id = Column(String(36), ForeignKey("stations.id", ondelete="SET NULL"), nullable=True)
    event_type = Column(String(32), nullable=False) # ARRIVAL, DEPARTURE, PASS
    event_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    actual_time = Column(DateTime, nullable=True)
    direction = Column(String(16), nullable=True)
    line = Column(String(32), nullable=True)
    status = Column(String(32), default=TrainStatus.SCHEDULED, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    train = relationship("Train", back_populates="movements")
    station = relationship("Station")
    corridor = relationship("Corridor")


class GoodsForecast(Base):
    __tablename__ = "goods_forecasts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    corridor_id = Column(String(36), ForeignKey("corridors.id", ondelete="CASCADE"), nullable=False, index=True)
    forecast_date = Column(DateTime, nullable=False, index=True)
    hour_start = Column(Integer, nullable=False) # 0-23
    hour_end = Column(Integer, nullable=False)   # 1-24
    expected_goods_trains = Column(Float, default=0.0, nullable=False)
    traffic_density = Column(String(16), default="LOW", nullable=False)
    movement_probability = Column(Float, default=0.8, nullable=False) # 0.0 - 1.0
    model_version = Column(String(32), default="v1.0", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    __table_args__ = (
        CheckConstraint("movement_probability >= 0 AND movement_probability <= 1", name="chk_goods_forecast_prob_range"),
    )

    corridor = relationship("Corridor", back_populates="goods_forecasts")

    @property
    def expected_goods_count(self) -> float:
        return self.expected_goods_trains

    @property
    def hour_slot(self) -> int:
        return self.hour_start

    @property
    def expected_trains(self) -> float:
        return self.expected_goods_trains
