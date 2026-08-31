from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin, generate_uuid

class Inspection(Base, TimestampMixin):
    __tablename__ = "inspections"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="RESTRICT"), nullable=True)
    inspection_type = Column(String(64), nullable=False)
    inspection_date = Column(DateTime, nullable=False, index=True)
    inspector = Column(String(64), nullable=False) # inspector reference
    condition_score = Column(Float, nullable=True)
    remarks = Column(Text, nullable=True) # findings
    next_inspection_date = Column(DateTime, nullable=True) # next_due_at
    source = Column(String(64), nullable=True)

    asset = relationship("Asset", back_populates="inspections")
    department = relationship("Department")

    # Backward compatibility properties
    @property
    def inspector_reference(self) -> str:
        return self.inspector

    @property
    def findings(self) -> str:
        return self.remarks or ""

    @property
    def next_due_at(self) -> datetime:
        return self.next_inspection_date
