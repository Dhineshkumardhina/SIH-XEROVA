from typing import Dict, List, Tuple

# Mapping of (HTTP method, endpoint path) to required permission strings.
# Path should match the router's prefix+path (e.g., "/api/v1/assets")
# Extend this dictionary with all endpoints that need permission enforcement.
ENDPOINT_PERMISSIONS: Dict[Tuple[str, str], List[str]] = {
    ("GET", "/api/v1/assets"): ["ASSET_VIEW"],
    ("POST", "/api/v1/assets"): ["ASSET_CREATE"],
    ("GET", "/api/v1/assets/{asset_id}"): ["ASSET_VIEW"],
    ("PUT", "/api/v1/assets/{asset_id}"): ["ASSET_UPDATE"],
    ("DELETE", "/api/v1/assets/{asset_id}"): ["ASSET_DELETE"],
    ("GET", "/api/v1/blocks"): ["BLOCK_VIEW"],
    ("POST", "/api/v1/blocks"): ["BLOCK_CREATE"],
    ("PUT", "/api/v1/blocks/{block_id}"): ["BLOCK_UPDATE"],
    ("POST", "/api/v1/blocks/{block_id}/approve"): ["BLOCK_APPROVE"],
    ("POST", "/api/v1/blocks/{block_id}/reject"): ["BLOCK_REJECT"],
    # Add additional endpoint mappings as needed for full coverage.
}
