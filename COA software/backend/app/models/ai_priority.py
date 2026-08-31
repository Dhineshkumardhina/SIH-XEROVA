from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base, generate_uuid, utc_now

class AIPriorityPrediction(Base):
    __tablename__ = "ai_priority_predictions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_id = Column(String(36), ForeignKey("maintenance_tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    
    priority_score = Column(Float, nullable=False)
    priority_level = Column(String(32), nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    
    model_name = Column(String(64), nullable=False)
    model_version = Column(String(32), nullable=False)
    
    factor_breakdown = Column(JSON, nullable=True)
    recommendation = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    maintenance_task = relationship("MaintenanceTask")
