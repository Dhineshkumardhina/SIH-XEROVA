from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.base import Base, generate_uuid, utc_now

class AssetHealth(Base):
    __tablename__ = "asset_health"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    health_score = Column(Float, nullable=False)
    inspection_score = Column(Float, nullable=True)
    condition_score = Column(Float, nullable=True)
    usage_score = Column(Float, nullable=True)
    defect_score = Column(Float, nullable=True)
    failure_count = Column(Integer, default=0, nullable=False)
    defect_count = Column(Integer, default=0, nullable=False)
    recorded_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    source = Column(String(64), nullable=True)
    extra_metadata = Column(JSON, nullable=True)

    asset = relationship("Asset", back_populates="health_history")
