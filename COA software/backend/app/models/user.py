from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin, generate_uuid

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(128), unique=True, nullable=False, index=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    full_name = Column(String(128), nullable=False)
    password_hash = Column(String(255), nullable=False)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    last_failed_login_at = Column(DateTime, nullable=True)
    last_login_at = Column(DateTime, nullable=True)

    roles = relationship("Role", secondary="user_roles", back_populates="users")
    department = relationship("Department")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")

    # Backward compatibility properties
    @property
    def name(self) -> str:
        return self.full_name

    @name.setter
    def name(self, value: str) -> None:
        self.full_name = value

    @property
    def hashed_password(self) -> str:
        return self.password_hash

    @hashed_password.setter
    def hashed_password(self, value: str) -> None:
        self.password_hash = value

    @property
    def active(self) -> bool:
        return self.is_active

    @active.setter
    def active(self, value: bool) -> None:
        self.is_active = value

    @property
    def role(self) -> str:
        if self.roles and len(self.roles) > 0:
            return self.roles[0].code
        return "VIEWER"

    @property
    def department_code(self) -> str:
        return self.department.code if self.department else ""

    @property
    def permissions(self) -> list[str]:
        perms = set()
        for r in self.roles:
            for p in r.permissions:
                perms.add(p.code)
        return list(perms)
