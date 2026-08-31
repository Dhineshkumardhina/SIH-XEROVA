from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.orm import relationship
from app.database.base import Base, generate_uuid, utc_now

class Permission(Base):
    __tablename__ = "permissions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(64), unique=True, nullable=False, index=True)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    resource = Column(String(64), nullable=False, index=True) # e.g. ASSET, BLOCK, USER
    action = Column(String(32), nullable=False, index=True)   # e.g. VIEW, CREATE, UPDATE, APPROVE
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    roles = relationship("Role", secondary="role_permissions", back_populates="permissions")
