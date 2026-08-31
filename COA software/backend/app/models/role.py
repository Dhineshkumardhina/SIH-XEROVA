from sqlalchemy import Column, String, Text, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin, generate_uuid

# Junction Table: role_permissions
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", String(36), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", String(36), ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True)
)

# Junction Table: user_roles
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", String(36), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
)

class Role(Base, TimestampMixin):
    __tablename__ = "roles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(64), unique=True, nullable=False, index=True) # SUPER_ADMIN, CONTROL_OFFICER, etc.
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)

    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")
    users = relationship("User", secondary=user_roles, back_populates="roles")
