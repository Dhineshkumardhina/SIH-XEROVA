from sqlalchemy import Column, String, Integer, Float, Boolean, JSON, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin, generate_uuid

class Corridor(Base, TimestampMixin):
    __tablename__ = "corridors"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(32), unique=True, nullable=False, index=True) # COR-A01, etc.
    name = Column(String(128), nullable=False)
    start_station_id = Column(String(36), ForeignKey("stations.id", ondelete="RESTRICT"), nullable=False, index=True)
    end_station_id = Column(String(36), ForeignKey("stations.id", ondelete="RESTRICT"), nullable=False, index=True)
    distance_km = Column(Float, default=0.0, nullable=False)
    track_count = Column(Integer, default=2, nullable=False)
    electrified = Column(Boolean, default=True, nullable=False)
    status = Column(String(32), default="OPERATIONAL", nullable=False)
    geometry = Column(JSON, nullable=True) # Synthetic GeoJSON Linestring

    __table_args__ = (
        CheckConstraint("distance_km >= 0", name="chk_corridor_distance_positive"),
        CheckConstraint("track_count > 0", name="chk_corridor_track_count_positive"),
    )

    start_station = relationship("Station", foreign_keys=[start_station_id])
    end_station = relationship("Station", foreign_keys=[end_station_id])
    assets = relationship("Asset", back_populates="corridor")
    block_plans = relationship("BlockPlan", back_populates="corridor")
    block_requests = relationship("BlockRequest", back_populates="corridor")
    goods_forecasts = relationship("GoodsForecast", back_populates="corridor")
