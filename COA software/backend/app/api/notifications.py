import random
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_authenticated_user
from app.models.user import User
from app.models.asset import Asset
from app.models.corridor import Corridor
from app.schemas.notification import NotificationResponse
from app.schemas.common import ApiResponse, PaginatedResponse, PaginatedData
from app.services import notification_service
from app.services.websocket_manager import ws_manager

router = APIRouter(prefix="/notifications", tags=["Notifications"])


class DemoEventGenerateRequest(BaseModel):
    event_type: Optional[str] = Field(None, description="Optional event type (e.g. CRITICAL_DEFECT, TRAIN_MOVEMENT, BLOCK_ACTIVATED, BLOCK_CONFLICT, AI_RECOMMENDATION, MAINTENANCE_OVERDUE)")
    corridor_id: Optional[str] = Field(None)
    severity: Optional[str] = Field("INFO")


@router.get("", response_model=PaginatedResponse[NotificationResponse], summary="List user notifications")
def get_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    severity: Optional[str] = Query(None),
    is_read: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    items, meta = notification_service.list_notifications(
        db=db, user_id=current_user.id, page=page, page_size=page_size,
        severity=severity, is_read=is_read
    )
    return PaginatedResponse(
        data=PaginatedData(items=[NotificationResponse.model_validate(n) for n in items], pagination=meta),
        message="Notifications retrieved successfully"
    )


@router.get("/unread", response_model=PaginatedResponse[NotificationResponse], summary="Get unread notifications")
def get_unread_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    items, meta = notification_service.get_unread_notifications(
        db=db, user_id=current_user.id, page=page, page_size=page_size
    )
    return PaginatedResponse(
        data=PaginatedData(items=[NotificationResponse.model_validate(n) for n in items], pagination=meta),
        message="Unread notifications retrieved successfully"
    )


@router.post("/{id}/read", response_model=ApiResponse[NotificationResponse], summary="Mark notification as read")
def mark_notification_read(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    notif = notification_service.mark_as_read(db, notification_id=id, user_id=current_user.id)
    return ApiResponse(
        data=NotificationResponse.model_validate(notif),
        message="Notification marked as read"
    )


@router.post("/read-all", response_model=ApiResponse[dict], summary="Mark all notifications as read")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    count = notification_service.mark_all_as_read(db, user_id=current_user.id)
    return ApiResponse(
        data={"marked_read_count": count},
        message=f"Marked {count} notifications as read"
    )


@router.delete("/{id}", response_model=ApiResponse[dict], summary="Delete a notification")
def delete_notification(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    notification_service.delete_notification(db, notification_id=id, user_id=current_user.id)
    return ApiResponse(
        data={"deleted": True, "id": id},
        message="Notification deleted successfully"
    )


@router.post("/demo/generate", response_model=ApiResponse[dict], summary="Generate synthetic live operations event")
async def generate_demo_event(
    payload: DemoEventGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    """
    Development & Demonstration synthetic operational event generator.
    Publishes real-time telemetry over WebSockets and records a notification where appropriate.
    """
    DEMO_TEMPLATES = [
        {
            "type": "TRAIN_MOVEMENT",
            "severity": "INFO",
            "message": "Express 12626 departed STN-A on schedule heading towards STN-B.",
            "data": {"train_number": "12626", "speed_kmh": 94.0, "section": "SEC-01", "signal_state": "GREEN"}
        },
        {
            "type": "CRITICAL_DEFECT",
            "severity": "CRITICAL",
            "title": "Critical Asset Flaw Detected",
            "message": "USFD Ultrasonic inspection identified 4.2mm railhead fissure on TRK-1002.",
            "entity_type": "Defect",
            "entity_id": "TRK-1002",
            "data": {"defect_type": "RAIL_FRACTURE", "urgency": "IMMEDIATE", "risk_score": 92.0}
        },
        {
            "type": "BLOCK_ACTIVATED",
            "severity": "WARNING",
            "title": "Possession Block Active",
            "message": "Possession block BP-260830-A01 active on COR-A01. Track isolation established.",
            "entity_type": "BlockPlan",
            "entity_id": "BP-260830-A01",
            "data": {"corridor": "COR-A01", "window": "01:00-03:00", "departments": ["ENG", "SIG"]}
        },
        {
            "type": "BLOCK_CONFLICT",
            "severity": "CRITICAL",
            "title": "Possession Headway Conflict Detected",
            "message": "Block window overlaps with scheduled freight 56813 on COR-A01.",
            "entity_type": "BlockConflict",
            "entity_id": "CONF-001",
            "data": {"train": "56813", "expected_delay_min": 8.0, "recommended_action": "Reschedule window"}
        },
        {
            "type": "AI_RECOMMENDATION",
            "severity": "INFO",
            "title": "AI Possession Plan Optimized",
            "message": "CP-SAT bundled 4 civil and signaling tasks saving 3.8 hours of downtime.",
            "entity_type": "AIRecommendation",
            "entity_id": "OPT-REC-01",
            "data": {"tasks_consolidated": 4, "time_saved_hours": 3.8, "delay_min": 0.0}
        },
        {
            "type": "MAINTENANCE_OVERDUE",
            "severity": "WARNING",
            "title": "Statutory Maintenance Overdue",
            "message": "Task MT-0012 for Point Machine PM-04 is overdue by 5 days.",
            "entity_type": "MaintenanceTask",
            "entity_id": "MT-0012",
            "data": {"days_overdue": 5, "priority": "HIGH"}
        }
    ]

    selected = None
    if payload.event_type:
        for t in DEMO_TEMPLATES:
            if t["type"] == payload.event_type.upper():
                selected = t
                break
    if not selected:
        selected = random.choice(DEMO_TEMPLATES)

    corridor = payload.corridor_id or "COR-A01"
    severity = payload.severity or selected["severity"]

    # If it has a title, create a notification in DB
    if "title" in selected:
        notification_service.create_notification(
            db=db,
            title=selected["title"],
            message=selected["message"],
            severity=severity,
            user_id=current_user.id,
            entity_type=selected.get("entity_type"),
            entity_id=selected.get("entity_id")
        )

    # Publish real-time WebSocket event
    event = await ws_manager.publish_event(
        event_type=selected["type"],
        message=selected["message"],
        severity=severity,
        corridor_id=corridor,
        asset_id=selected.get("entity_id"),
        data=selected.get("data", {})
    )

    return ApiResponse(
        data={"published": True, "event": event},
        message="Synthetic operations event published successfully"
    )
