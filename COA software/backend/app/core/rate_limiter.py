import time
import os
import threading
from typing import Dict, List, Tuple
from fastapi import Request, status
from fastapi.responses import JSONResponse

class MemoryRateLimiter:
    """
    Thread-safe sliding-window rate limiter for sensitive API routes.
    Disabled automatically during automated testing.
    """
    def __init__(self):
        self._lock = threading.Lock()
        self._requests: Dict[str, List[float]] = {}

        # Disable during automated pytest runs or if explicitly turned off
        is_testing = bool(os.getenv("PYTEST_CURRENT_TEST") or os.getenv("ENVIRONMENT") == "testing")
        self.enabled = not is_testing and (os.getenv("RATE_LIMITING_ENABLED", "true").lower() == "true")
        
        self.limits = {
            "/api/v1/auth/login": int(os.getenv("RATE_LIMIT_LOGIN", "100")),
            "/api/v1/auth/refresh": int(os.getenv("RATE_LIMIT_REFRESH", "100")),
            "/api/v1/planner/daily/generate": int(os.getenv("RATE_LIMIT_OPTIMIZATION", "100")),
            "/api/v1/optimization/run": int(os.getenv("RATE_LIMIT_OPTIMIZATION", "100")),
            "/api/v1/simulation/run": int(os.getenv("RATE_LIMIT_SIMULATION", "100")),
        }

    def check_rate_limit(self, request: Request) -> bool:
        # Re-check test env variable dynamically
        if os.getenv("PYTEST_CURRENT_TEST"):
            return True

        if not self.enabled:
            return True

        path = request.url.path
        # Match rate limit rules
        limit = None
        for rule_path, max_reqs in self.limits.items():
            if path.startswith(rule_path):
                limit = max_reqs
                break

        if not limit:
            if path.startswith("/api/v1/ai/"):
                limit = int(os.getenv("RATE_LIMIT_AI", "120"))
            else:
                return True

        client_ip = request.client.host if request.client else "127.0.0.1"
        key = f"{client_ip}:{path}"
        now = time.time()
        window_start = now - 60.0

        with self._lock:
            timestamps = [t for t in self._requests.get(key, []) if t > window_start]
            if len(timestamps) >= limit:
                return False
            timestamps.append(now)
            self._requests[key] = timestamps
            return True

rate_limiter = MemoryRateLimiter()
