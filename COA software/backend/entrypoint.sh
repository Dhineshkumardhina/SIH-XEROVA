#!/usr/bin/env bash
set -e

echo "========================================================"
echo "RAILOPT AI — Backend Container Initializing"
echo "========================================================"

# Wait for database readiness using Python connection check
echo "Checking database connectivity..."
python - << 'EOF'
import sys
import time
import os
from sqlalchemy import create_engine, text

db_url = os.getenv("DATABASE_URL", "sqlite:///./railopt_ai.db")

# SQLite doesn't need network wait
if db_url.startswith("sqlite"):
    print("Using SQLite database.")
    sys.exit(0)

print(f"Connecting to database (sanitized): {db_url.split('@')[-1] if '@' in db_url else 'local'}...")

max_retries = 30
retry_interval = 2

for attempt in range(1, max_retries + 1):
    try:
        engine = create_engine(db_url, connect_args={"connect_timeout": 3})
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("Database connection successfully established!")
        sys.exit(0)
    except Exception as e:
        print(f"Database not ready yet (attempt {attempt}/{max_retries}): {e}")
        time.sleep(retry_interval)

print("CRITICAL: Failed to connect to database after maximum retries.")
sys.exit(1)
EOF

# Run database migrations
echo "Executing database migrations (alembic upgrade head)..."
alembic upgrade head || {
    echo "WARNING: Alembic migration encountered an issue. Initializing tables via SQLAlchemy metadata..."
    python -c "from app.database.session import engine; from app.models.domain import Base; Base.metadata.create_all(bind=engine)"
    alembic stamp head || true
}

echo "Database schema ready."
echo "Starting RAILOPT AI FastAPI Application..."

# Execute passed command (default: uvicorn)
exec "$@"
