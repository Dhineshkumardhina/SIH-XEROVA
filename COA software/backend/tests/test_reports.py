import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database.session import SessionLocal

client = TestClient(app)
DEMO_PWD = "RailoptDemo@2026"


def get_auth_token(username: str = "control") -> str:
    res = client.post("/api/v1/auth/login", json={"username": username, "password": DEMO_PWD})
    assert res.status_code == 200
    return res.json()["data"]["access_token"]


def test_report_generation_daily_plan():
    """TEST 1: Generate Daily Block Plan report and verify dynamic database compilation"""
    token = get_auth_token("control")
    headers = {"Authorization": f"Bearer {token}"}

    gen_res = client.post("/api/v1/reports/generate", json={
        "report_type": "DAILY_BLOCK_PLAN",
        "corridor_id": "COR-A01",
        "options": {
            "include_charts": True,
            "include_details": True,
            "include_ai_explanation": True
        }
    }, headers=headers)

    assert gen_res.status_code == 201
    body = gen_res.json()
    assert body["success"] is True
    data = body["data"]

    assert data["report_type"] == "DAILY_BLOCK_PLAN"
    assert "report_code" in data
    assert data["status"] == "COMPLETED"
    assert "summary_metrics" in data
    assert "total_blocks" in data["summary_metrics"]
    assert "approved_blocks" in data["summary_metrics"]


def test_report_generation_maintenance_and_assets():
    """TEST 2: Generate Maintenance & Asset Availability Reports with Department Filtering"""
    token = get_auth_token("engineering")
    headers = {"Authorization": f"Bearer {token}"}

    # Maintenance Report
    m_res = client.post("/api/v1/reports/generate", json={
        "report_type": "MAINTENANCE_REPORT",
        "department": "ENG"
    }, headers=headers)
    assert m_res.status_code == 201
    m_data = m_res.json()["data"]
    assert m_data["report_type"] == "MAINTENANCE_REPORT"
    assert "completion_rate_pct" in m_data["summary_metrics"]

    # Asset Report
    a_res = client.post("/api/v1/reports/generate", json={
        "report_type": "ASSET_AVAILABILITY"
    }, headers=headers)
    assert a_res.status_code == 201
    a_data = a_res.json()["data"]
    assert "availability_pct" in a_data["summary_metrics"]


def test_pdf_export_generation():
    """TEST 3: Download Report as PDF and verify ReportLab binary output"""
    token = get_auth_token("control")
    headers = {"Authorization": f"Bearer {token}"}

    # Generate report
    gen_res = client.post("/api/v1/reports/generate", json={
        "report_type": "EXECUTIVE_SUMMARY"
    }, headers=headers)
    report_id = gen_res.json()["data"]["id"]

    # Download PDF
    pdf_res = client.get(f"/api/v1/reports/{report_id}/pdf", headers=headers)
    assert pdf_res.status_code == 200
    assert "application/pdf" in pdf_res.headers["content-type"]
    # Verify PDF magic header %PDF
    assert pdf_res.content.startswith(b"%PDF")
    assert len(pdf_res.content) > 500


def test_csv_export_generation():
    """TEST 4: Download Report as CSV and verify UTF-8 content with headers"""
    token = get_auth_token("control")
    headers = {"Authorization": f"Bearer {token}"}

    gen_res = client.post("/api/v1/reports/generate", json={
        "report_type": "DAILY_BLOCK_PLAN"
    }, headers=headers)
    report_id = gen_res.json()["data"]["id"]

    csv_res = client.get(f"/api/v1/reports/{report_id}/csv", headers=headers)
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    text = csv_res.text
    assert "RAILOPT AI OPERATIONS REPORT" in text
    assert "DEMONSTRATION ENVIRONMENT" in text
    assert "EXECUTIVE SUMMARY METRICS" in text


def test_excel_export_generation():
    """TEST 5: Download Report as Excel (.xlsx) and verify openpyxl workbook structure"""
    token = get_auth_token("control")
    headers = {"Authorization": f"Bearer {token}"}

    gen_res = client.post("/api/v1/reports/generate", json={
        "report_type": "AI_OPTIMIZATION"
    }, headers=headers)
    report_id = gen_res.json()["data"]["id"]

    excel_res = client.get(f"/api/v1/reports/{report_id}/excel", headers=headers)
    assert excel_res.status_code == 200
    assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in excel_res.headers["content-type"]
    # Verify zip / openpyxl magic header PK
    assert excel_res.content.startswith(b"PK")
    assert len(excel_res.content) > 1000


def test_report_history_and_details_api():
    """TEST 6: List report history and retrieve detailed report metadata"""
    token = get_auth_token("control")
    headers = {"Authorization": f"Bearer {token}"}

    list_res = client.get("/api/v1/reports?limit=10", headers=headers)
    assert list_res.status_code == 200
    body = list_res.json()
    assert body["success"] is True
    assert len(body["data"]) >= 1
    report_id = body["data"][0]["id"]

    det_res = client.get(f"/api/v1/reports/{report_id}", headers=headers)
    assert det_res.status_code == 200
    det_body = det_res.json()
    assert det_body["success"] is True
    assert det_body["data"]["id"] == report_id
