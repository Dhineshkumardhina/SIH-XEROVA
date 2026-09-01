"""
RAILOPT AI — Phase 4 Authentication & RBAC Seeding Script
Populates:
1. System Roles (SUPER_ADMIN, CONTROL_OFFICER, BLOCK_PLANNER, etc.)
2. System Permissions across resources
3. Role-Permission Junction Mappings
4. Synthetic Demo Users with native bcrypt hashed passwords
"""
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.core.security import hash_password
from app.models import Role, Permission, User, Department

ROLES_DATA = [
    {
        "code": "SUPER_ADMIN",
        "name": "Super Administrator",
        "description": "Full access to platform administration, user management, and system parameters."
    },
    {
        "code": "CONTROL_OFFICER",
        "name": "Control Officer",
        "description": "Traffic control office authority with block approval, rejection, and operational oversight."
    },
    {
        "code": "BLOCK_PLANNER",
        "name": "Block Planner",
        "description": "Block demand coordination, bundle creation, optimization runs, and schedule adjustments."
    },
    {
        "code": "ENGINEERING_OFFICER",
        "name": "Civil Engineering Officer",
        "description": "Permanent way and track maintenance authority; block demand creation for track assets."
    },
    {
        "code": "SIGNAL_TELECOM_OFFICER",
        "name": "Signal & Telecom Officer",
        "description": "Signaling, interlocking, and communication systems maintenance and block planning."
    },
    {
        "code": "TRACTION_OFFICER",
        "name": "Traction Distribution Officer",
        "description": "Overhead equipment, power feeds, and substation maintenance block coordination."
    },
    {
        "code": "MAINTENANCE_SUPERVISOR",
        "name": "Maintenance Supervisor",
        "description": "Field execution of maintenance tasks, task completion reporting, and defect updates."
    },
    {
        "code": "ANALYST",
        "name": "Operations Analyst",
        "description": "Historical analytics, delay pattern investigation, and report generation."
    },
    {
        "code": "VIEWER",
        "name": "Operational Viewer",
        "description": "Read-only observer access to approved operational schedules and asset dashboards."
    },
]

PERMISSIONS_DATA = [
    # Dashboard
    {"code": "DASHBOARD_VIEW", "name": "View Dashboard", "resource": "DASHBOARD", "action": "VIEW"},
    # Assets
    {"code": "ASSET_VIEW", "name": "View Assets", "resource": "ASSET", "action": "VIEW"},
    {"code": "ASSET_CREATE", "name": "Create Assets", "resource": "ASSET", "action": "CREATE"},
    {"code": "ASSET_UPDATE", "name": "Update Assets", "resource": "ASSET", "action": "UPDATE"},
    # Maintenance
    {"code": "MAINTENANCE_VIEW", "name": "View Maintenance Tasks", "resource": "MAINTENANCE", "action": "VIEW"},
    {"code": "MAINTENANCE_CREATE", "name": "Create Maintenance Tasks", "resource": "MAINTENANCE", "action": "CREATE"},
    {"code": "MAINTENANCE_UPDATE", "name": "Update Maintenance Tasks", "resource": "MAINTENANCE", "action": "UPDATE"},
    {"code": "MAINTENANCE_COMPLETE", "name": "Complete Maintenance Tasks", "resource": "MAINTENANCE", "action": "COMPLETE"},
    # Defects
    {"code": "DEFECT_VIEW", "name": "View Defects", "resource": "DEFECT", "action": "VIEW"},
    {"code": "DEFECT_CREATE", "name": "Log Defects", "resource": "DEFECT", "action": "CREATE"},
    {"code": "DEFECT_UPDATE", "name": "Update Defects", "resource": "DEFECT", "action": "UPDATE"},
    # Trains & Corridors
    {"code": "TRAIN_VIEW", "name": "View Trains & Schedules", "resource": "TRAIN", "action": "VIEW"},
    {"code": "CORRIDOR_VIEW", "name": "View Corridors & Track Geometry", "resource": "CORRIDOR", "action": "VIEW"},
    # Blocks
    {"code": "BLOCK_VIEW", "name": "View Block Demands & Plans", "resource": "BLOCK", "action": "VIEW"},
    {"code": "BLOCK_CREATE", "name": "Submit Block Demands", "resource": "BLOCK", "action": "CREATE"},
    {"code": "BLOCK_UPDATE", "name": "Edit Block Plans", "resource": "BLOCK", "action": "UPDATE"},
    {"code": "BLOCK_APPROVE", "name": "Approve Block Plans", "resource": "BLOCK", "action": "APPROVE"},
    {"code": "BLOCK_REJECT", "name": "Reject Block Plans", "resource": "BLOCK", "action": "REJECT"},
    # AI Engine
    {"code": "AI_VIEW", "name": "View AI Insights & Predictions", "resource": "AI", "action": "VIEW"},
    {"code": "AI_GENERATE", "name": "Generate AI Predictions", "resource": "AI", "action": "GENERATE"},
    # Optimization
    {"code": "OPTIMIZATION_VIEW", "name": "View Optimization Runs", "resource": "OPTIMIZATION", "action": "VIEW"},
    {"code": "OPTIMIZATION_RUN", "name": "Execute Block Optimization", "resource": "OPTIMIZATION", "action": "RUN"},
    # Simulation
    {"code": "SIMULATION_VIEW", "name": "View Digital Twin Simulation", "resource": "SIMULATION", "action": "VIEW"},
    {"code": "SIMULATION_RUN", "name": "Run What-If Simulations", "resource": "SIMULATION", "action": "RUN"},
    # Reports & Analytics
    {"code": "REPORT_VIEW", "name": "View Reports", "resource": "REPORT", "action": "VIEW"},
    {"code": "REPORT_GENERATE", "name": "Generate Operational Reports", "resource": "REPORT", "action": "GENERATE"},
    {"code": "ANALYTICS_VIEW", "name": "View Advanced Analytics", "resource": "ANALYTICS", "action": "VIEW"},
    # User Administration
    {"code": "USER_VIEW", "name": "View Users", "resource": "USER", "action": "VIEW"},
    {"code": "USER_CREATE", "name": "Create Users", "resource": "USER", "action": "CREATE"},
    {"code": "USER_UPDATE", "name": "Update Users", "resource": "USER", "action": "UPDATE"},
    {"code": "USER_DELETE", "name": "Delete Users", "resource": "USER", "action": "DELETE"},
    # Roles & Permissions
    {"code": "ROLE_VIEW", "name": "View Roles & Permissions", "resource": "ROLE", "action": "VIEW"},
    {"code": "ROLE_UPDATE", "name": "Update Role Permissions", "resource": "ROLE", "action": "UPDATE"},
    # Audit & Settings
    {"code": "AUDIT_VIEW", "name": "View Audit Trails", "resource": "AUDIT", "action": "VIEW"},
    {"code": "SYSTEM_SETTINGS_VIEW", "name": "View System Parameters", "resource": "SYSTEM", "action": "VIEW"},
    {"code": "SYSTEM_SETTINGS_UPDATE", "name": "Update System Parameters", "resource": "SYSTEM", "action": "UPDATE"},
]

ROLE_PERMISSIONS_MAP = {
    "SUPER_ADMIN": [p["code"] for p in PERMISSIONS_DATA],
    "CONTROL_OFFICER": [
        "DASHBOARD_VIEW", "ASSET_VIEW", "MAINTENANCE_VIEW", "DEFECT_VIEW",
        "TRAIN_VIEW", "CORRIDOR_VIEW", "BLOCK_VIEW", "BLOCK_CREATE", "BLOCK_UPDATE",
        "BLOCK_APPROVE", "BLOCK_REJECT", "AI_VIEW", "AI_GENERATE",
        "OPTIMIZATION_VIEW", "OPTIMIZATION_RUN", "SIMULATION_VIEW", "SIMULATION_RUN",
        "REPORT_VIEW", "REPORT_GENERATE", "ANALYTICS_VIEW", "AUDIT_VIEW", "USER_VIEW",
        "ROLE_VIEW", "SYSTEM_SETTINGS_VIEW"
    ],
    "BLOCK_PLANNER": [
        "DASHBOARD_VIEW", "ASSET_VIEW", "MAINTENANCE_VIEW", "TRAIN_VIEW",
        "CORRIDOR_VIEW", "BLOCK_VIEW", "BLOCK_CREATE", "BLOCK_UPDATE",
        "AI_VIEW", "AI_GENERATE", "OPTIMIZATION_VIEW", "OPTIMIZATION_RUN", "SIMULATION_VIEW",
        "REPORT_VIEW", "ANALYTICS_VIEW", "AUDIT_VIEW", "USER_VIEW"
    ],
    "ENGINEERING_OFFICER": [
        "DASHBOARD_VIEW", "ASSET_VIEW", "ASSET_CREATE", "ASSET_UPDATE",
        "MAINTENANCE_VIEW", "MAINTENANCE_CREATE", "MAINTENANCE_UPDATE",
        "DEFECT_VIEW", "DEFECT_CREATE", "DEFECT_UPDATE",
        "CORRIDOR_VIEW", "BLOCK_VIEW", "BLOCK_CREATE", "AI_VIEW", "AUDIT_VIEW", "REPORT_VIEW"
    ],
    "SIGNAL_TELECOM_OFFICER": [
        "DASHBOARD_VIEW", "ASSET_VIEW", "ASSET_CREATE", "ASSET_UPDATE",
        "MAINTENANCE_VIEW", "MAINTENANCE_CREATE", "MAINTENANCE_UPDATE",
        "DEFECT_VIEW", "DEFECT_CREATE", "DEFECT_UPDATE",
        "CORRIDOR_VIEW", "BLOCK_VIEW", "BLOCK_CREATE", "AI_VIEW", "AUDIT_VIEW", "REPORT_VIEW"
    ],
    "TRACTION_OFFICER": [
        "DASHBOARD_VIEW", "ASSET_VIEW", "ASSET_CREATE", "ASSET_UPDATE",
        "MAINTENANCE_VIEW", "MAINTENANCE_CREATE", "MAINTENANCE_UPDATE",
        "DEFECT_VIEW", "DEFECT_CREATE", "DEFECT_UPDATE",
        "CORRIDOR_VIEW", "BLOCK_VIEW", "BLOCK_CREATE", "AI_VIEW", "AUDIT_VIEW", "REPORT_VIEW"
    ],
    "MAINTENANCE_SUPERVISOR": [
        "ASSET_VIEW", "MAINTENANCE_VIEW", "MAINTENANCE_UPDATE", "MAINTENANCE_COMPLETE",
        "DEFECT_VIEW", "DEFECT_UPDATE", "BLOCK_VIEW", "AUDIT_VIEW"
    ],
    "ANALYST": [
        "DASHBOARD_VIEW", "ASSET_VIEW", "MAINTENANCE_VIEW", "DEFECT_VIEW",
        "TRAIN_VIEW", "CORRIDOR_VIEW", "BLOCK_VIEW", "ANALYTICS_VIEW",
        "REPORT_VIEW", "AI_VIEW", "AUDIT_VIEW"
    ],
    "VIEWER": [
        "DASHBOARD_VIEW", "ASSET_VIEW", "MAINTENANCE_VIEW", "TRAIN_VIEW",
        "CORRIDOR_VIEW", "REPORT_VIEW", "AUDIT_VIEW"
    ]
}

DEMO_USERS_DATA = [
    {
        "email": "admin@railopt.demo",
        "username": "admin",
        "full_name": "System Administrator",
        "role_code": "SUPER_ADMIN",
        "department_code": None
    },
    {
        "email": "control@railopt.demo",
        "username": "control",
        "full_name": "Arun Kumar",
        "role_code": "CONTROL_OFFICER",
        "department_code": None
    },
    {
        "email": "planner@railopt.demo",
        "username": "planner",
        "full_name": "Vikramaditya Sen",
        "role_code": "BLOCK_PLANNER",
        "department_code": None
    },
    {
        "email": "engineering@railopt.demo",
        "username": "engineering",
        "full_name": "Priya Sharma",
        "role_code": "ENGINEERING_OFFICER",
        "department_code": "ENGINEERING"
    },
    {
        "email": "signal@railopt.demo",
        "username": "signal",
        "full_name": "Rajesh Varma",
        "role_code": "SIGNAL_TELECOM_OFFICER",
        "department_code": "SIGNAL_TELECOM"
    },
    {
        "email": "traction@railopt.demo",
        "username": "traction",
        "full_name": "Amitabh Mukherjee",
        "role_code": "TRACTION_OFFICER",
        "department_code": "TRACTION"
    },
    {
        "email": "supervisor@railopt.demo",
        "username": "supervisor",
        "full_name": "Ramesh Naik",
        "role_code": "MAINTENANCE_SUPERVISOR",
        "department_code": "ENGINEERING"
    },
    {
        "email": "analyst@railopt.demo",
        "username": "analyst",
        "full_name": "Deepa Balakrishnan",
        "role_code": "ANALYST",
        "department_code": None
    },
    {
        "email": "viewer@railopt.demo",
        "username": "viewer",
        "full_name": "Suresh Menon",
        "role_code": "VIEWER",
        "department_code": None
    }
]

DEMO_PASSWORD = "RailoptDemo@2026"

def seed_auth_data(db: Session):
    print("Seeding System Permissions...")
    perm_dict = {}
    for p_data in PERMISSIONS_DATA:
        perm = db.query(Permission).filter_by(code=p_data["code"]).first()
        if not perm:
            perm = Permission(
                code=p_data["code"],
                name=p_data["name"],
                description=p_data.get("description", p_data["name"]),
                resource=p_data["resource"],
                action=p_data["action"]
            )
            db.add(perm)
            db.flush()
        perm_dict[p_data["code"]] = perm

    print("Seeding System Roles...")
    role_dict = {}
    for r_data in ROLES_DATA:
        role = db.query(Role).filter_by(code=r_data["code"]).first()
        if not role:
            role = Role(
                code=r_data["code"],
                name=r_data["name"],
                description=r_data["description"]
            )
            db.add(role)
            db.flush()
        role_dict[r_data["code"]] = role

    print("Mapping Role-Permission relationships...")
    for role_code, perm_codes in ROLE_PERMISSIONS_MAP.items():
        role = role_dict.get(role_code)
        if role:
            current_perms = {p.code for p in role.permissions}
            for code in perm_codes:
                if code in perm_dict and code not in current_perms:
                    role.permissions.append(perm_dict[code])

    db.commit()

    print("Seeding Synthetic Demonstration User Accounts...")
    departments = {d.code: d for d in db.query(Department).all()}
    pwd_hash = hash_password(DEMO_PASSWORD)

    for u_data in DEMO_USERS_DATA:
        user = db.query(User).filter(
            (User.email == u_data["email"]) | (User.username == u_data["username"])
        ).first()

        dept = departments.get(u_data["department_code"]) if u_data["department_code"] else None
        role = role_dict.get(u_data["role_code"])

        if not user:
            user = User(
                email=u_data["email"],
                username=u_data["username"],
                full_name=u_data["full_name"],
                password_hash=pwd_hash,
                department_id=dept.id if dept else None,
                is_active=True,
                is_locked=False,
                roles=[role] if role else []
            )
            db.add(user)
        else:
            user.username = u_data["username"]
            user.email = u_data["email"]
            user.full_name = u_data["full_name"]
            user.password_hash = pwd_hash
            user.department_id = dept.id if dept else None
            user.is_active = True
            user.is_locked = False
            if role and role not in user.roles:
                user.roles.append(role)

    db.commit()
    print("Authentication and RBAC data seeded successfully.")

def main():
    db = SessionLocal()
    try:
        seed_auth_data(db)
    finally:
        db.close()

if __name__ == "__main__":
    main()
