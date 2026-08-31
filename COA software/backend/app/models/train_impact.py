from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from app.database.base import Base, generate_uuid, utc_now


class TrainImpact(Base):
    __tablename__ = "train_impacts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    block_id = Column(String(36), ForeignKey("block_requests.id", ondelete="CASCADE"), nullable=True, index=True)
    corridor_id = Column(String(36), ForeignKey("corridors.id", ondelete="CASCADE"), nullable=False, index=True)
    train_id = Column(String(36), ForeignKey("trains.id", ondelete="CASCADE"), nullable=False, index=True)
    
    impact_type = Column(String(32), default="LOW", nullable=False) # NO_IMPACT, LOW, MEDIUM, HIGH, CRITICAL
    estimated_delay_minutes = Column(Float, default=0.0, nullable=False)
    maximum_delay_minutes = Column(Float, default=0.0, nullable=False)
    passenger_impact = Column(Integer, default=0, nullable=False)
    goods_impact = Column(String(64), nullable=True)
    operational_impact = Column(String(32), default="LOW", nullable=False)
    reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    __table_args__ = (
        Index("ix_train_impact_block_train", "block_id", "train_id"),
        Index("ix_train_impact_corridor_date", "corridor_id", "created_at"),
    )

    block_request = relationship("BlockRequest")
    corridor = relationship("Corridor")
    train = relationship("Train")
