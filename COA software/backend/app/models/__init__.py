from app.database.base import Base, TimestampMixin, generate_uuid
from app.models.department import Department, DepartmentType, DepartmentCodeEnum
from app.models.zone import Zone
from app.models.division import Division
from app.models.station import Station
from app.models.corridor import Corridor
from app.models.asset import (
    Asset, AssetType, AssetTypeEnum, AssetStatus, AssetStatusEnum,
    TrackAsset, SignalAsset, TelecomAsset, OHEAsset, Feeder, Transformer, Substation, PointMachine
)
from app.models.asset_health import AssetHealth
from app.models.inspection import Inspection
from app.models.maintenance import (
    MaintenanceTask, MaintenanceHistory,
    MaintenanceType, TaskTypeEnum, MaintenanceStatus, MaintenanceStatusEnum, PriorityLevel, PriorityEnum
)
from app.models.defect import Defect, DefectSeverity, DefectSeverityEnum, DefectStatus
from app.models.block import (
    BlockRequest, BlockPlan, BlockTask, BlockConflict, BlockApproval,
    BlockRequestStatus, BlockStatusEnum, ConflictType, ConflictTypeEnum, BlockApprovalAction, BlockApprovalActionEnum
)
from app.models.train import (
    Train, TrainSchedule, TrainMovement, GoodsForecast,
    TrainType, TrainTypeEnum, TrainDirection, TrainDirectionEnum, TrainStatus
)
from app.models.train_impact import TrainImpact
from app.models.ai_priority import AIPriorityPrediction
from app.models.ai import AssetRiskPrediction, AIPrediction, AIRecommendation
from app.models.optimization import OptimizationRun, OptimizationResult
from app.models.simulation import SimulationScenario, SimulationRun, SimulationEvent
from app.models.notification import Notification
from app.models.audit import AuditLog
from app.models.system import SystemSetting
from app.models.user import User
from app.models.role import Role, user_roles, role_permissions
from app.models.permission import Permission
from app.models.report import Report
from app.models.refresh_token import RefreshToken

__all__ = [
    "Base",
    "TimestampMixin",
    "generate_uuid",
    "Department",
    "DepartmentType",
    "DepartmentCodeEnum",
    "Zone",
    "Division",
    "Station",
    "Corridor",
    "Asset",
    "AssetType",
    "AssetTypeEnum",
    "AssetStatus",
    "AssetStatusEnum",
    "TrackAsset",
    "SignalAsset",
    "TelecomAsset",
    "OHEAsset",
    "Feeder",
    "Transformer",
    "Substation",
    "PointMachine",
    "AssetHealth",
    "Inspection",
    "MaintenanceTask",
    "MaintenanceHistory",
    "MaintenanceType",
    "TaskTypeEnum",
    "MaintenanceStatus",
    "MaintenanceStatusEnum",
    "PriorityLevel",
    "PriorityEnum",
    "Defect",
    "DefectSeverity",
    "DefectSeverityEnum",
    "DefectStatus",
    "BlockRequest",
    "BlockPlan",
    "BlockTask",
    "BlockConflict",
    "BlockApproval",
    "BlockRequestStatus",
    "BlockStatusEnum",
    "ConflictType",
    "ConflictTypeEnum",
    "BlockApprovalAction",
    "BlockApprovalActionEnum",
    "Train",
    "TrainSchedule",
    "TrainMovement",
    "GoodsForecast",
    "TrainType",
    "TrainTypeEnum",
    "TrainDirection",
    "TrainDirectionEnum",
    "TrainStatus",
    "TrainImpact",
    "AIPriorityPrediction",
    "AssetRiskPrediction",
    "AIPrediction",
    "AIRecommendation",
    "OptimizationRun",
    "OptimizationResult",
    "SimulationScenario",
    "SimulationRun",
    "SimulationEvent",
    "Notification",
    "AuditLog",
    "SystemSetting",
    "User",
    "Role",
    "user_roles",
    "role_permissions",
    "Permission",
    "Report",
    "RefreshToken",
]
