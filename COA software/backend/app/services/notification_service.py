import asyncio
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc

from app.models.notification import Notification
from app.core.pagination import paginate_query
from app.core.exceptions import ResourceNotFoundError
from app.services.websocket_manager import ws_manager


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def list_notifications(
    db: Session,
    user_id: Optional[str] = None,
    page: int = 1,
    page_size: int = 25,
    severity: Optional[str] = None,
    is_read: Optional[bool] = None
):
    query = db.query(Notification)
    if user_id:
        query = query.filter((Notification.user_id == user_id) | (Notification.user_id == None))
    if severity:
        query = query.filter(Notification.severity == severity.upper())
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)

    return paginate_query(
        query=query,
        page=page,
        page_size=page_size,
        default_sort=Notification.created_at.desc()
    )


def get_unread_notifications(db: Session, user_id: Optional[str] = None, page: int = 1, page_size: int = 25):
    return list_notifications(db=db, user_id=user_id, page=page, page_size=page_size, is_read=False)


def mark_as_read(db: Session, notification_id: str, user_id: Optional[str] = None) -> Notification:
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise ResourceNotFoundError("Notification", notification_id)
    notif.is_read = True
    notif.read_at = _utcnow()
    db.commit()
    db.refresh(notif)
    return notif


def mark_all_as_read(db: Session, user_id: Optional[str] = None) -> int:
    query = db.query(Notification).filter(Notification.is_read == False)
    if user_id:
        query = query.filter((Notification.user_id == user_id) | (Notification.user_id == None))
    count = query.update({"is_read": True, "read_at": _utcnow()}, synchronize_session=False)
    db.commit()
    return count


def delete_notification(db: Session, notification_id: str, user_id: Optional[str] = None) -> bool:
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise ResourceNotFoundError("Notification", notification_id)
    db.delete(notif)
    db.commit()
    return True


def create_notification(
    db: Session,
    title: str,
    message: str,
    severity: str = "INFO",
    user_id: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    prevent_duplicate_minutes: int = 15
) -> Notification:
    """
    Creates an operational notification with duplicate suppression and WebSocket event publishing.
    """
    now = _utcnow()

    # Duplicate alert prevention for active unread alerts within time window
    if prevent_duplicate_minutes > 0 and entity_type and entity_id:
        recent_threshold = now - timedelta(minutes=prevent_duplicate_minutes)
        existing = db.query(Notification).filter(
            Notification.entity_type == entity_type,
            Notification.entity_id == entity_id,
            Notification.title == title,
            Notification.is_read == False,
            Notification.created_at >= recent_threshold
        ).first()
        if existing:
            return existing

    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        severity=severity.upper(),
        entity_type=entity_type,
        entity_id=entity_id,
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    # Publish real-time event through WebSocket Manager (background task safe)
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(
                ws_manager.publish_event(
                    event_type=entity_type or "SYSTEM_ALERT",
                    message=message,
                    severity=severity,
                    asset_id=entity_id if entity_type == "Asset" else None,
                    data={
                        "notification_id": notif.id,
                        "title": title,
                        "entity_type": entity_type,
                        "entity_id": entity_id
                    },
                    target_user_id=user_id
                )
            )
    except Exception:
        pass

    return notif
