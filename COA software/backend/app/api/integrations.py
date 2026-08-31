from typing import List, Dict, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, require_authenticated_user
from app.models.user import User
from app.schemas.integration import IntegrationSyncResult
from app.schemas.common import ApiResponse
from app.services import integration_service

router = APIRouter(prefix="/integrations", tags=["Integrations"])

# ── TMS (Track Management System) ───────────────────────────────────

@router.get("/tms/assets", response_model=ApiResponse[List[Dict[str, Any]]], summary="Mock TMS assets feed")
def get_tms_assets(current_user: User = Depends(require_authenticated_user)):
    return ApiResponse(data=integration_service.get_mock_tms_assets(), message="TMS assets retrieved")

@router.get("/tms/maintenance", response_model=ApiResponse[List[Dict[str, Any]]], summary="Mock TMS maintenance feed")
def get_tms_maintenance(current_user: User = Depends(require_authenticated_user)):
    return ApiResponse(data=integration_service.get_mock_tms_maintenance(), message="TMS maintenance retrieved")

@router.get("/tms/defects", response_model=ApiResponse[List[Dict[str, Any]]], summary="Mock TMS defects feed")
def get_tms_defects(current_user: User = Depends(require_authenticated_user)):
    return ApiResponse(data=integration_service.get_mock_tms_defects(), message="TMS defects retrieved")

@router.post("/tms/sync", response_model=ApiResponse[IntegrationSyncResult], summary="Trigger TMS synchronization")
def sync_tms_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    result = integration_service.sync_tms(db, user_id=current_user.id)
    return ApiResponse(data=result, message="TMS data synchronized into CRDM")

# ── SMMS (Signalling Maintenance Management System) ──────────────────

@router.get("/smms/assets", response_model=ApiResponse[List[Dict[str, Any]]], summary="Mock SMMS assets feed")
def get_smms_assets(current_user: User = Depends(require_authenticated_user)):
    return ApiResponse(data=integration_service.get_mock_smms_assets(), message="SMMS assets retrieved")

@router.get("/smms/maintenance", response_model=ApiResponse[List[Dict[str, Any]]], summary="Mock SMMS maintenance feed")
def get_smms_maintenance(current_user: User = Depends(require_authenticated_user)):
    return ApiResponse(data=integration_service.get_mock_smms_maintenance(), message="SMMS maintenance retrieved")

@router.get("/smms/defects", response_model=ApiResponse[List[Dict[str, Any]]], summary="Mock SMMS defects feed")
def get_smms_defects(current_user: User = Depends(require_authenticated_user)):
    return ApiResponse(data=integration_service.get_mock_smms_defects(), message="SMMS defects retrieved")

@router.post("/smms/sync", response_model=ApiResponse[IntegrationSyncResult], summary="Trigger SMMS synchronization")
def sync_smms_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    result = integration_service.sync_smms(db, user_id=current_user.id)
    return ApiResponse(data=result, message="SMMS data synchronized into CRDM")

# ── TDMS (Traction Distribution Management System) ───────────────────

@router.get("/tdms/assets", response_model=ApiResponse[List[Dict[str, Any]]], summary="Mock TDMS assets feed")
def get_tdms_assets(current_user: User = Depends(require_authenticated_user)):
    return ApiResponse(data=integration_service.get_mock_tdms_assets(), message="TDMS assets retrieved")

@router.get("/tdms/maintenance", response_model=ApiResponse[List[Dict[str, Any]]], summary="Mock TDMS maintenance feed")
def get_tdms_maintenance(current_user: User = Depends(require_authenticated_user)):
    return ApiResponse(data=integration_service.get_mock_tdms_maintenance(), message="TDMS maintenance retrieved")

@router.get("/tdms/defects", response_model=ApiResponse[List[Dict[str, Any]]], summary="Mock TDMS defects feed")
def get_tdms_defects(current_user: User = Depends(require_authenticated_user)):
    return ApiResponse(data=integration_service.get_mock_tdms_defects(), message="TDMS defects retrieved")

@router.post("/tdms/sync", response_model=ApiResponse[IntegrationSyncResult], summary="Trigger TDMS synchronization")
def sync_tdms_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    result = integration_service.sync_tdms(db, user_id=current_user.id)
    return ApiResponse(data=result, message="TDMS data synchronized into CRDM")

# ── BDMS (Block Demand Management System) ────────────────────────────

@router.get("/bdms/blocks", response_model=ApiResponse[List[Dict[str, Any]]], summary="Mock BDMS block requests feed")
def get_bdms_blocks(current_user: User = Depends(require_authenticated_user)):
    return ApiResponse(data=integration_service.get_mock_bdms_blocks(), message="BDMS blocks retrieved")

@router.post("/bdms/sync", response_model=ApiResponse[IntegrationSyncResult], summary="Trigger BDMS synchronization")
def sync_bdms_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    result = integration_service.sync_bdms(db, user_id=current_user.id)
    return ApiResponse(data=result, message="BDMS data synchronized into CRDM")

# ── COA (Control Office Application) ─────────────────────────────────

@router.get("/coa/trains", response_model=ApiResponse[List[Dict[str, Any]]], summary="Mock COA trains feed")
def get_coa_trains(current_user: User = Depends(require_authenticated_user)):
    return ApiResponse(data=integration_service.get_mock_coa_trains(), message="COA trains retrieved")

@router.get("/coa/movements", response_model=ApiResponse[List[Dict[str, Any]]], summary="Mock COA movements feed")
def get_coa_movements(current_user: User = Depends(require_authenticated_user)):
    return ApiResponse(data=integration_service.get_mock_coa_movements(), message="COA movements retrieved")

@router.post("/coa/sync", response_model=ApiResponse[IntegrationSyncResult], summary="Trigger COA synchronization")
def sync_coa_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    result = integration_service.sync_coa(db, user_id=current_user.id)
    return ApiResponse(data=result, message="COA data synchronized into CRDM")

# ── Overall System Integration Health Telemetry ──────────────────────

@router.get("/status", response_model=ApiResponse[integration_service.IntegrationHealthSummary], summary="Retrieve integration status and health of all legacy railway adapters")
def get_integrations_health(
    current_user: User = Depends(require_authenticated_user)
):
    summary = integration_service.get_integrations_health_status()
    return ApiResponse(
        data=summary,
        message="Integration status and health summary retrieved successfully"
    )

