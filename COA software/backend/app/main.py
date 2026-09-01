import json
import time
from typing import Optional
from fastapi import FastAPI, APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.api import (
    dashboard, assets, tasks, blocks, auth, users, roles,
    departments, stations, corridors, maintenance, defects,
    trains, forecasts, notifications, audit, integrations,
    analytics, ai, optimization, planner, simulation, reports
)
from app.api.dependencies import get_db
from app.models.user import User
from app.services.websocket_manager import ws_manager
from app.core.config import settings
import uuid
from app.core.exceptions import (
    AppException, app_exception_handler, http_exception_handler, validation_exception_handler, unhandled_exception_handler, create_error_response
)
from app.core.rate_limiter import rate_limiter

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.TAGLINE,
    version=settings.VERSION,
    openapi_tags=[
        {"name": "Authentication", "description": "User authentication, JWT & Refresh tokens, profile and password management"},
        {"name": "Users", "description": "Administrative user management and RBAC assignments"},
        {"name": "Departments", "description": "Engineering, Signalling, and Traction railway departments"},
        {"name": "Stations", "description": "Railway stations, junctions, and division points"},
        {"name": "Corridors", "description": "Railway corridors, track sections, and availability monitoring"},
        {"name": "Assets", "description": "CRDM railway asset inventory, health tracking, and risk assessment"},
        {"name": "Maintenance", "description": "Maintenance task scheduling, execution, and overdue detection"},
        {"name": "Defects", "description": "Infrastructure defects, severity ratings, and resolution workflows"},
        {"name": "Trains", "description": "Train master directory, schedules, movements, and forecasting"},
        {"name": "Forecasts", "description": "Goods and freight train traffic forecasting"},
        {"name": "Blocks", "description": "Block requests, corridor block planning, conflict detection, and approvals"},
        {"name": "Notifications", "description": "User operational alerts and notification feeds"},
        {"name": "Audit", "description": "Compliance security and action audit trail logs"},
        {"name": "Integrations", "description": "Simulated legacy railway feeds (TMS, SMMS, TDMS, BDMS, COA) & CRDM sync"},
        {"name": "AI", "description": "Artificial Intelligence models for predictive analytics and advisory"},
    ]
)

# Exception Handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

# Request ID & Rate Limiter & Security Headers Middleware
@app.middleware("http")
async def app_middleware_stack(request, call_next):
    # 1. Attach Request ID
    req_id = f"req_{uuid.uuid4().hex[:8]}"
    request.state.request_id = req_id

    # 2. Check Rate Limiting
    if not rate_limiter.check_rate_limit(request):
        return create_error_response(
            code="RATE_LIMIT_EXCEEDED",
            message="Too many requests. Please slow down and try again.",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            request_id=req_id
        )

    # 3. Call Next & Add Security Headers
    response = await call_next(request)
    response.headers["X-Request-ID"] = req_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Version Router
api_router = APIRouter(prefix=settings.API_V1_STR)

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(roles.router)
api_router.include_router(departments.router)
api_router.include_router(stations.router)
api_router.include_router(corridors.router)
api_router.include_router(assets.router)
api_router.include_router(maintenance.router)
api_router.include_router(tasks.router)
api_router.include_router(defects.router)
api_router.include_router(trains.router)
api_router.include_router(forecasts.router)
api_router.include_router(blocks.router)
api_router.include_router(notifications.router)
api_router.include_router(ai.router)
api_router.include_router(audit.router)
api_router.include_router(integrations.router)
api_router.include_router(dashboard.router)
api_router.include_router(analytics.router)
api_router.include_router(optimization.router)
api_router.include_router(planner.router)
api_router.include_router(simulation.router)
api_router.include_router(reports.router)
# Demo endpoint for SIH guided demonstration
from app.api import demo
api_router.include_router(demo.router)

app.include_router(api_router)

@app.get("/")
def read_root():
    return {
        "name": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "version": settings.VERSION,
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Health check returning status, database and redis connectivity."""
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "unhealthy"

    redis_status = "healthy"
    try:
        if ws_manager.redis_client:
            ws_manager.redis_client.ping()
        else:
            import redis
            r = redis.from_url(settings.REDIS_URL, socket_connect_timeout=1)
            r.ping()
    except Exception:
        redis_status = "unhealthy"

    is_healthy = (db_status == "healthy")
    status_str = "healthy" if is_healthy else "unhealthy"

    return {
        "status": status_str,
        "service": "railopt-backend",
        "database": db_status,
        "redis": redis_status,
        "success": is_healthy,
        "data": {
            "status": status_str,
            "service": "railopt-backend",
            "database": db_status,
            "redis": redis_status,
            "environment": settings.ENVIRONMENT,
            "version": settings.VERSION
        },
        "message": f"{settings.PROJECT_NAME} backend is operational"
    }

@app.get("/health/db")
def db_health_check(db: Session = Depends(get_db)):
    """Detailed database connectivity and migration status verification."""
    start_time = time.time()
    try:
        db.execute(text("SELECT 1"))
        alembic_version = None
        try:
            version_result = db.execute(text("SELECT version_num FROM alembic_version")).fetchone()
            if version_result:
                alembic_version = version_result[0]
        except Exception:
            alembic_version = "untracked_or_uninitialized"

        latency_ms = round((time.time() - start_time) * 1000, 2)
        db_type = "postgresql" if "postgres" in settings.DATABASE_URL else "sqlite"

        return {
            "success": True,
            "data": {
                "database_status": "healthy",
                "database_type": db_type,
                "latency_ms": latency_ms,
                "current_migration": alembic_version,
                "pool_pre_ping": True
            },
            "message": "Database connection verified and operational"
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={
                "success": False,
                "data": {
                    "database_status": "unhealthy",
                    "error": str(e)
                },
                "message": "Database connection failed"
            }
        )


@app.websocket("/ws/operations")
async def websocket_operations_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Real-Time Operations WebSocket Channel.
    Authenticates incoming clients with JWT token and maintains live bidirectional event stream.
    """
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        roles = payload.get("roles", [])
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    dept_code = user.department.code if user.department else None
    client = await ws_manager.connect(
        websocket=websocket,
        user_id=user.id,
        username=user.username,
        roles=roles,
        department=dept_code
    )

    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong", "timestamp": time.time()}))
            except Exception:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

