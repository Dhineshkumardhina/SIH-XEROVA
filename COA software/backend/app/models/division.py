from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin, generate_uuid

class Division(Base, TimestampMixin):
    __tablename__ = "divisions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    zone_id = Column(String(36), ForeignKey("zones.id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(String(32), unique=True, nullable=False, index=True)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)

    zone = relationship("Zone", back_populates="divisions")
    stations = relationship("Station", back_populates="division", cascade="all, delete-orphan")
