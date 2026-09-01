import sys
import argparse
from pathlib import Path
from typing import List

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker

# Import the project's settings to get the database URL
try:
    from app.core.config import settings
except Exception:
    # Fallback for when the script is executed from the repository root
    import os
    import importlib.util
    spec = importlib.util.spec_from_file_location("settings", Path(__file__).parents[3] / "app" / "core" / "config.py")
    cfg = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(cfg)
    settings = cfg.settings

# Helper: collect all tables from the database metadata
engine = create_engine(settings.DATABASE_URL, echo=False, future=True)
SessionLocal = sessionmaker(bind=engine)

def run_checks(session) -> List[str]:
    """Run a series of integrity checks.
    Returns a list of human‑readable error strings. An empty list means the DB is clean.
    """
    errors: List[str] = []
    inspector = inspect(session.bind)
    tables = inspector.get_table_names()

    # 1. Orphan foreign‑key records – use SQLite pragma or generic query
    # For SQLite we can use PRAGMA foreign_key_check; for other DBs we build a generic query.
    if session.bind.dialect.name == "sqlite":
        result = session.execute(text("PRAGMA foreign_key_check"))
        for row in result:
            # row: (table, rowid, parent, fkidx)
            errors.append(
                f"Orphan FK in table '{row[0]}' (rowid {row[1]}) referencing parent '{row[2]}'"
            )
    else:
        # Generic approach: for each FK, left‑join and look for NULLs
        for tbl in tables:
            fks = inspector.get_foreign_keys(tbl)
            for fk in fks:
                parent = fk["referred_table"]
                local_cols = ", ".join(fk["constrained_columns"])
                remote_cols = ", ".join(fk["referred_columns"])
                sql = f"SELECT {tbl}.id FROM {tbl} LEFT JOIN {parent} ON ({tbl}.{local_cols}) = ({parent}.{remote_cols}) WHERE {parent}.id IS NULL"
                result = session.execute(text(sql))
                for row in result:
                    errors.append(
                        f"Orphan FK in table '{tbl}' referencing missing '{parent}' (id {row[0]})"
                    )

    # 2. Duplicate primary keys / unique fields – rely on DB constraints. We can attempt to SELECT COUNT(*) GROUP BY id > 1
    for tbl in tables:
        pk = inspector.get_primary_key_constraint(tbl).get("constrained_columns")
        if pk:
            col = pk[0]
            sql = f"SELECT {col}, COUNT(*) FROM {tbl} GROUP BY {col} HAVING COUNT(*) > 1"
            result = session.execute(text(sql))
            for row in result:
                errors.append(f"Duplicate primary key '{col}' value {row[0]} in table '{tbl}'")

    # 3. Temporal consistency – check for start/end columns if they exist
    for tbl in tables:
        columns = [c["name"] for c in inspector.get_columns(tbl)]
        if "start_time" in columns and "end_time" in columns:
            sql = f"SELECT id, start_time, end_time FROM {tbl} WHERE start_time > end_time"
            result = session.execute(text(sql))
            for row in result:
                errors.append(
                    f"Invalid time range in '{tbl}' (id {row[0]}): start_time {row[1]} after end_time {row[2]}"
                )
        if "duration_minutes" in columns:
            sql = f"SELECT id, duration_minutes FROM {tbl} WHERE duration_minutes < 0"
            result = session.execute(text(sql))
            for row in result:
                errors.append(
                    f"Negative duration in '{tbl}' (id {row[0]}): {row[1]} minutes"
                )

    # 4. Status transition sanity – example for maintenance.status
    if "maintenance" in tables:
        sql = "SELECT id, status FROM maintenance WHERE status NOT IN ('pending', 'in_progress', 'completed', 'cancelled')"
        result = session.execute(text(sql))
        for row in result:
            errors.append(
                f"Invalid maintenance status '{row[1]}' in record id {row[0]}"
            )

    return errors

def generate_report(errors: List[str]) -> str:
    if not errors:
        return "# Data Integrity Validation Report\n\nAll checks passed – no integrity violations were found."
    report_lines = ["# Data Integrity Validation Report", "", "## Detected Issues", ""]
    for err in errors:
        report_lines.append(f"- {err}")
    return "\n".join(report_lines)

def main(output_path: Path):
    session = SessionLocal()
    try:
        errors = run_checks(session)
        report = generate_report(errors)
        output_path.write_text(report, encoding="utf-8")
        print(report)
        sys.exit(1 if errors else 0)
    finally:
        session.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate data integrity across the RAILOPT database.")
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=Path(__file__).parents[2] / "docs" / "PHASE_50_DATA_INTEGRITY.md",
        help="Path to write the markdown validation report.",
    )
    args = parser.parse_args()
    main(args.output)
