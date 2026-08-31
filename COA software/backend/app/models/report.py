from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin, generate_uuid


class Report(Base, TimestampMixin):
    """
    Persisted metadata and execution state of generated operational reports.
    """
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    report_code = Column(String(64), unique=True, nullable=False, index=True)
    report_type = Column(String(64), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    
    generated_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    corridor_id = Column(String(36), ForeignKey("corridors.id", ondelete="SET NULL"), nullable=True)
    
    parameters = Column(JSON, default=dict)
    summary_metrics = Column(JSON, default=dict)
    status = Column(String(32), default="COMPLETED", nullable=False)
    completed_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    generated_by = relationship("User", foreign_keys=[generated_by_id])
    department = relationship("Department", foreign_keys=[department_id])
    corridor = relationship("Corridor", foreign_keys=[corridor_id])
