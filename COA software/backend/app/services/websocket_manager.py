"""
RAILOPT AI — Real-Time WebSocket Operations & Event Bus Manager
Manages authenticated real-time WebSocket client sessions, event broadcasting,
role/department targeting, and Redis Pub/Sub bridging with in-memory fallback.
"""
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Set
from fastapi import WebSocket, WebSocketDisconnect
from app.core.config import settings

logger = logging.getLogger("railopt.websocket")


def _utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class ConnectedClient:
    def __init__(
        self,
        websocket: WebSocket,
        user_id: str,
        username: str,
        roles: List[str],
        department: Optional[str] = None
    ):
        self.websocket = websocket
        self.user_id = user_id
        self.username = username
        self.roles = [r.upper() for r in roles]
        self.department = department.upper() if department else None
        self.connected_at = _utcnow_iso()


class WebSocketManager:
    """
    Central event distributor and WebSocket connection manager.
    """
    def __init__(self):
        self.active_connections: Dict[WebSocket, ConnectedClient] = {}
        self.redis_client = None
        self._init_redis()

    def _init_redis(self):
        redis_url = getattr(settings, "REDIS_URL", None)
        if not redis_url:
            self.redis_client = None
            return
        try:
            import redis
            client = redis.from_url(redis_url, socket_connect_timeout=0.2)
            client.ping()
            self.redis_client = client
            logger.info("WebSocketManager successfully connected to Redis Pub/Sub")
        except Exception:
            self.redis_client = None
            logger.info("Redis not active. Using high-performance in-memory event bus fallback.")

    async def connect(
        self,
        websocket: WebSocket,
        user_id: str,
        username: str,
        roles: List[str],
        department: Optional[str] = None
    ) -> ConnectedClient:
        await websocket.accept()
        client = ConnectedClient(
            websocket=websocket,
            user_id=user_id,
            username=username,
            roles=roles,
            department=department
        )
        self.active_connections[websocket] = client
        logger.info(f"WebSocket client connected: user={username} ({user_id}), roles={roles}, total={len(self.active_connections)}")
        
        # Send initial system connect handshake event
        await self.send_personal_message(
            websocket,
            {
                "event_id": f"EVT-INIT-{uuid.uuid4().hex[:6].upper()}",
                "event_type": "SYSTEM_ALERT",
                "severity": "INFO",
                "timestamp": _utcnow_iso(),
                "message": "Connected to RAILOPT AI Real-Time Operations Channel",
                "data": {
                    "user_id": user_id,
                    "roles": roles,
                    "connected_clients": len(self.active_connections),
                    "environment": "DEMONSTRATION ENVIRONMENT — SYNTHETIC DATA"
                }
            }
        )
        return client

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            client = self.active_connections.pop(websocket)
            logger.info(f"WebSocket client disconnected: user={client.username}, total={len(self.active_connections)}")

    async def send_personal_message(self, websocket: WebSocket, message: Dict[str, Any]):
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.warning(f"Failed to send personal message to client: {e}")
            self.disconnect(websocket)

    async def broadcast(self, event: Dict[str, Any]):
        """
        Broadcasts an operational event to all connected clients.
        """
        disconnected = []
        payload = json.dumps(event)
        for ws in list(self.active_connections.keys()):
            try:
                await ws.send_text(payload)
            except Exception:
                disconnected.append(ws)

        for ws in disconnected:
            self.disconnect(ws)

    async def send_to_user(self, user_id: str, event: Dict[str, Any]):
        """
        Sends an operational event to all connections belonging to a specific user.
        """
        payload = json.dumps(event)
        for ws, client in list(self.active_connections.items()):
            if client.user_id == user_id:
                try:
                    await ws.send_text(payload)
                except Exception:
                    self.disconnect(ws)

    async def send_to_role(self, role: str, event: Dict[str, Any]):
        """
        Sends an event to all connected clients possessing the specified role.
        """
        role_upper = role.upper()
        payload = json.dumps(event)
        for ws, client in list(self.active_connections.items()):
            if role_upper in client.roles or "SUPER_ADMIN" in client.roles or "CONTROL_OFFICER" in client.roles:
                try:
                    await ws.send_text(payload)
                except Exception:
                    self.disconnect(ws)

    async def send_to_department(self, department: str, event: Dict[str, Any]):
        """
        Sends an event to all connected clients matching the department or control officers.
        """
        dept_upper = department.upper()
        payload = json.dumps(event)
        for ws, client in list(self.active_connections.items()):
            if (client.department and dept_upper in client.department) or "CONTROL_OFFICER" in client.roles or "SUPER_ADMIN" in client.roles:
                try:
                    await ws.send_text(payload)
                except Exception:
                    self.disconnect(ws)

    async def publish_event(
        self,
        event_type: str,
        message: str,
        severity: str = "INFO",
        corridor_id: Optional[str] = None,
        asset_id: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None,
        target_user_id: Optional[str] = None,
        target_role: Optional[str] = None,
        target_department: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Constructs and delivers a standardized operational event.
        """
        event_id = f"EVT-{uuid.uuid4().hex[:8].upper()}"
        event = {
            "event_id": event_id,
            "event_type": event_type.upper(),
            "severity": severity.upper(),
            "timestamp": _utcnow_iso(),
            "corridor_id": corridor_id,
            "asset_id": asset_id,
            "message": message,
            "data": data or {}
        }

        # Deliver to specific targets or broadcast
        if target_user_id:
            await self.send_to_user(target_user_id, event)
        elif target_role:
            await self.send_to_role(target_role, event)
        elif target_department:
            await self.send_to_department(target_department, event)
        else:
            await self.broadcast(event)

        # Publish to Redis if active
        if self.redis_client:
            try:
                self.redis_client.publish("railopt_events", json.dumps(event))
            except Exception as e:
                logger.debug(f"Redis publish notice: {e}")

        return event

    def get_connected_count(self) -> int:
        return len(self.active_connections)


ws_manager = WebSocketManager()
