from sqlalchemy import Column, String, Text, JSON
from app.database.base import Base, TimestampMixin, generate_uuid

class SystemSetting(Base, TimestampMixin):
    __tablename__ = "system_settings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    key = Column(String(64), unique=True, nullable=False, index=True)
    value = Column(JSON, nullable=False)
    description = Column(Text, nullable=True)
    updated_by = Column(String(64), nullable=True)
