import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, MetaData
from sqlalchemy.orm import declarative_base

# Standard naming conventions for deterministic Alembic constraint naming
naming_convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

metadata = MetaData(naming_convention=naming_convention)
Base = declarative_base(metadata=metadata)

def generate_uuid() -> str:
    """Generate RFC 4122 compliant UUID string."""
    return str(uuid.uuid4())

def utc_now() -> datetime:
    """Generate timezone-aware UTC current timestamp."""
    return datetime.now(timezone.utc)

class TimestampMixin:
    """
    Common Timestamp Convention
    Provides timezone-aware created_at and updated_at timestamps in UTC.
    """
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)
