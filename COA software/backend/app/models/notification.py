from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from app.database.base import Base, generate_uuid, utc_now

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    severity = Column(String(32), default="INFO", nullable=False) # INFO, WARNING, CRITICAL
    title = Column(String(128), nullable=False)
    message = Column(Text, nullable=False)
    entity_type = Column(String(64), nullable=True)
    entity_id = Column(String(64), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    read_at = Column(DateTime, nullable=True)
