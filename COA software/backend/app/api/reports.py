"""
RAILOPT AI — Operations Reports & Export API Router
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_authenticated_user, require_permission
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.report import (
    ReportGenerateRequest,
    ReportSummaryResponse,
    ReportDetailResponse
)
from app.services.report_service import report_service

router = APIRouter(prefix="/reports", tags=["Operational Reports & Export"])


from app.api.dependencies import get_db, require_authenticated_user, require_permission, require_role

@router.post("/generate", response_model=ApiResponse[ReportDetailResponse], status_code=status.HTTP_201_CREATED, summary="Generate an operational report")
def generate_report(
    payload: ReportGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("SUPER_ADMIN", "CONTROL_OFFICER", "BLOCK_PLANNER", "ENGINEERING_OFFICER", "SIGNAL_TELECOM_OFFICER", "TRACTION_OFFICER", "MAINTENANCE_SUPERVISOR", "ANALYST"))
):
    report = report_service.generate_report(
        db=db,
        report_type=payload.report_type,
        start_date=payload.start_date,
        end_date=payload.end_date,
        department=payload.department,
        corridor_id=payload.corridor_id,
        options=payload.options,
        user=current_user
    )

    data = ReportDetailResponse(
        id=report.id,
        report_code=report.report_code,
        report_type=report.report_type,
        title=report.title,
        generated_by=current_user.full_name or current_user.username,
        start_date=report.start_date,
        end_date=report.end_date,
        summary_metrics=report.summary_metrics or {},
        parameters=report.parameters or {},
        status=report.status,
        created_at=report.created_at,
        completed_at=report.completed_at
    )
    return ApiResponse(
        data=data,
        message=f"{report.title} generated successfully"
    )


@router.get("", response_model=ApiResponse[List[ReportSummaryResponse]], summary="List generated operational report history")
def list_reports(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    reports = report_service.list_reports(db=db, limit=limit, user=current_user)
    items = [
        ReportSummaryResponse(
            id=r.id,
            report_code=r.report_code,
            report_type=r.report_type,
            title=r.title,
            generated_by=r.generated_by.full_name if r.generated_by else "System",
            start_date=r.start_date,
            end_date=r.end_date,
            summary_metrics=r.summary_metrics or {},
            status=r.status,
            created_at=r.created_at,
            completed_at=r.completed_at
        )
        for r in reports
    ]
    return ApiResponse(
        data=items,
        message="Report history retrieved successfully"
    )


@router.get("/{id}", response_model=ApiResponse[ReportDetailResponse], summary="Get operational report details")
def get_report_details(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    report = report_service.get_report_by_id(db=db, report_id=id)
    data = ReportDetailResponse(
        id=report.id,
        report_code=report.report_code,
        report_type=report.report_type,
        title=report.title,
        generated_by=report.generated_by.full_name if report.generated_by else "System",
        start_date=report.start_date,
        end_date=report.end_date,
        summary_metrics=report.summary_metrics or {},
        parameters=report.parameters or {},
        status=report.status,
        created_at=report.created_at,
        completed_at=report.completed_at
    )
    return ApiResponse(
        data=data,
        message="Report details retrieved successfully"
    )


@router.get("/{id}/pdf", summary="Download report as PDF")
def download_pdf(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    report = report_service.get_report_by_id(db=db, report_id=id)
    pdf_buffer = report_service.export_pdf(report)
    filename = f"{report.report_code.lower()}_{report.report_type.lower()}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/{id}/csv", summary="Download report as CSV")
def download_csv(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    report = report_service.get_report_by_id(db=db, report_id=id)
    csv_text = report_service.export_csv(report)
    filename = f"{report.report_code.lower()}_{report.report_type.lower()}.csv"

    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/{id}/excel", summary="Download report as Excel (.xlsx)")
def download_excel(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    report = report_service.get_report_by_id(db=db, report_id=id)
    xlsx_buffer = report_service.export_excel(report)
    filename = f"{report.report_code.lower()}_{report.report_type.lower()}.xlsx"

    return StreamingResponse(
        xlsx_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
