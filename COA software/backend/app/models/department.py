import enum
from sqlalchemy import Column, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin, generate_uuid

class DepartmentType(str, enum.Enum):
    ENGINEERING = "ENGINEERING"           # TMS
    SIGNAL_TELECOM = "SIGNAL_TELECOM"     # SMMS
    TRACTION = "TRACTION"                 # TDMS

# Alias for backward compatibility
DepartmentCodeEnum = DepartmentType

class Department(Base, TimestampMixin):
    __tablename__ = "departments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(32), unique=True, nullable=False, index=True) # ENG, SNT, TRC, or full code
    name = Column(String(128), unique=True, nullable=False)
    description = Column(Text, nullable=True)

    assets = relationship("Asset", back_populates="department")
    maintenance_tasks = relationship("MaintenanceTask", back_populates="department")
    defects = relationship("Defect", back_populates="department")
    block_requests = relationship("BlockRequest", back_populates="department")
