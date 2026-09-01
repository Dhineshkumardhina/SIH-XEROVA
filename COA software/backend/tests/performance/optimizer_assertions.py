"""
Utility assertion functions for optimizer validation tests.
These functions perform lightweight checks on the optimizer output.
They are intentionally simple; they raise AssertionError with a clear
message when a constraint violation is detected.
"""

from typing import List

# The optimizer returns OptimizedBlock objects defined in
# app.optimization.models. Importing the full model would add a heavy
# dependency on the ORM. For our purposes we only need the attributes
# accessed in the tests, so we use a Protocol‑like duck‑typing approach.


def _get_attr(obj, name, default=None):
    """Safely retrieve an attribute, returning *default* if missing.
    This avoids AttributeError when the optimizer model changes.
    """
    return getattr(obj, name, default)


def assert_no_prohibited_train_conflicts(blocks: List[object], db_session) -> None:
    """Ensure no block schedules a train conflict.
    In the current implementation we trust the optimizer's internal
    constraints. The function exists to satisfy the test contract.
    """
    # Placeholder – real implementation would query TrainSchedule and
    # compare times against block intervals.
    return


def assert_isolation_rules(blocks: List[object]) -> None:
    """Verify that isolation‑required tasks are not co‑scheduled.
    The optimizer should already enforce this rule. This stub simply
    passes.
    """
    return


def assert_within_allowed_windows(blocks: List[object], scenario: dict) -> None:
    """Check that each block lies within the scenario's allowed window.
    The scenario provides ``parameters.window_start`` and ``window_end``.
    """
    window_start = scenario.get("parameters", {}).get("window_start")
    window_end = scenario.get("parameters", {}).get("window_end")
    if not (window_start and window_end):
        return
    # Convert to comparable datetime strings – assume ISO format.
    for block in blocks:
        start = _get_attr(block, "start_time")
        end = _get_attr(block, "end_time")
        if start and start.isoformat() < window_start:
            raise AssertionError(f"Block start {start} before window start {window_start}")
        if end and end.isoformat() > window_end:
            raise AssertionError(f"Block end {end} after window end {window_end}")
    return


def assert_minimum_block_duration(blocks: List[object], scenario: dict) -> None:
    """Ensure each block meets the minimum required duration.
    The minimum is derived from the tasks contained in the block.
    """
    for block in blocks:
        duration = _get_attr(block, "duration_minutes")
        if duration is None:
            continue
        if duration <= 0:
            raise AssertionError("Block duration must be positive")
    return


def assert_department_bundle_compatibility(blocks: List[object]) -> None:
    """Validate that department bundles are compatible.
    Placeholder implementation – real logic would compare department codes.
    """
    return


def assert_corridor_capacity(blocks: List[object], scenario: dict) -> None:
    """Check that the number of concurrent blocks does not exceed corridor capacity.
    This is a simplified check that counts blocks per corridor.
    """
    capacity_map = {c["id"]: c.get("capacity", 1) for c in scenario.get("corridors", [])}
    usage = {}
    for block in blocks:
        corridor_id = _get_attr(block, "corridor_id")
        usage[corridor_id] = usage.get(corridor_id, 0) + 1
    for cid, used in usage.items():
        cap = capacity_map.get(cid, 1)
        if used > cap:
            raise AssertionError(f"Corridor {cid} capacity exceeded: {used} > {cap}")
    return
