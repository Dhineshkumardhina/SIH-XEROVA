import os
import subprocess
import sys
import tempfile
from pathlib import Path

import pytest

# Path to the validator script relative to this test file
VALIDATOR_PATH = Path(__file__).parents[1] / "scripts" / "validate_data_integrity.py"

@pytest.fixture(scope="function")
def temp_db_file():
    """Create a temporary SQLite file for testing."""
    with tempfile.NamedTemporaryFile(suffix=".sqlite", delete=False) as tf:
        db_path = tf.name
    yield db_path
    try:
        os.remove(db_path)
    except OSError:
        pass

def run_validator(db_url: str, output_path: Path) -> subprocess.CompletedProcess:
    """Execute the validator as a subprocess.
    Returns the CompletedProcess object.
    """
    env = os.environ.copy()
    env["DATABASE_URL"] = db_url
    cmd = [sys.executable, str(VALIDATOR_PATH), "-o", str(output_path)]
    return subprocess.run(cmd, env=env, capture_output=True, text=True)

def test_validator_on_empty_database(temp_db_file):
    """The validator should report no issues on an empty SQLite DB."""
    db_url = f"sqlite:///{temp_db_file}"
    report_path = Path(temp_db_file).with_suffix(".md")
    result = run_validator(db_url, report_path)
    assert result.returncode == 0, f"Validator exited with {result.returncode}, stderr: {result.stderr}"
    assert "All checks passed" in report_path.read_text()
