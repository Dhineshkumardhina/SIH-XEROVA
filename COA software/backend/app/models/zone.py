from sqlalchemy import Column, String, Text
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin, generate_uuid

class Zone(Base, TimestampMixin):
    __tablename__ = "zones"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(32), unique=True, nullable=False, index=True)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)

    divisions = relationship("Division", back_populates="zone", cascade="all, delete-orphan")
