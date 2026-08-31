from sqlalchemy import Column, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin, generate_uuid

class Station(Base, TimestampMixin):
    __tablename__ = "stations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    division_id = Column(String(36), ForeignKey("divisions.id", ondelete="SET NULL"), nullable=True, index=True)
    code = Column(String(32), unique=True, nullable=False, index=True) # STN-A, etc.
    name = Column(String(128), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    division = relationship("Division", back_populates="stations")
    assets = relationship("Asset", back_populates="station")
