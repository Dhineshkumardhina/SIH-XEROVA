from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.models.maintenance import MaintenanceTask
from app.models.asset import Asset
from app.models.defect import Defect
from app.models.ai_priority import AIPriorityPrediction
from app.ai.priority.factory import PriorityModelFactory

class AIPriorityService:
    @staticmethod
    def _build_task_context(db: Session, task: MaintenanceTask) -> Dict[str, Any]:
        duration = getattr(task, 'duration_minutes', getattr(task, 'estimated_duration_minutes', 60))
        context = {
            "status": getattr(task, 'status', 'OPEN'),
            "maintenance_duration": duration,
        }
        
        # Urgency & Overdue
        now = datetime.utcnow()
        if task.due_date:
            due = task.due_date.replace(tzinfo=None)
            days_diff = (due - now).days
            
            if days_diff < 0:
                context["overdue_days"] = abs(days_diff)
                context["urgency_raw"] = "Overdue"
                context["urgency_score"] = 100
            elif days_diff == 0:
                context["overdue_days"] = 0
                context["urgency_raw"] = "Due Today"
                context["urgency_score"] = 90
            elif days_diff <= 2:
                context["overdue_days"] = 0
                context["urgency_raw"] = "Due in 2 days"
                context["urgency_score"] = 80
            elif days_diff <= 7:
                context["overdue_days"] = 0
                context["urgency_raw"] = "Due in 7 days"
                context["urgency_score"] = 60
            elif days_diff <= 14:
                context["overdue_days"] = 0
                context["urgency_raw"] = "Due in 14 days"
                context["urgency_score"] = 40
            else:
                context["overdue_days"] = 0
                context["urgency_raw"] = f"Due in {days_diff} days"
                context["urgency_score"] = 20
        else:
            context["overdue_days"] = 0
            context["urgency_raw"] = "No due date"
            context["urgency_score"] = 0

        # Asset info & Risk integration
        if task.asset_id:
            asset = db.scalar(select(Asset).where(Asset.id == task.asset_id))
            if asset:
                context["asset_criticality"] = asset.criticality_score
                context["operational_importance"] = "HIGH" # Fallback if asset doesn't define it explicitly
                
                # Fetch latest asset risk prediction if available
                from app.ai.risk_engine import risk_engine
                latest_risk = risk_engine.get_latest_prediction(db, asset.id)
                if latest_risk:
                    context["failure_probability"] = latest_risk.failure_probability
                    context["asset_risk_score"] = latest_risk.risk_score
                    context["asset_risk_level"] = latest_risk.risk_level
                
        # Defect info
        # Check if task has an associated defect (assuming foreign key or link table, let's check for defect_id on task or tasks on defect)
        if hasattr(task, "defect_id") and task.defect_id:
            defect = db.scalar(select(Defect).where(Defect.id == task.defect_id))
            if defect:
                context["defect_severity"] = defect.severity
                context["safety_impact"] = defect.safety_impact if hasattr(defect, "safety_impact") else "MEDIUM"
                context["train_impact"] = defect.train_impact if hasattr(defect, "train_impact") else "MEDIUM"

        return context

    @classmethod
    def calculate_priority(cls, db: Session, task_id: str, weights: Dict[str, float] = None) -> AIPriorityPrediction:
        task = db.scalar(select(MaintenanceTask).where(MaintenanceTask.id == task_id))
        if not task:
            raise ValueError(f"Maintenance task {task_id} not found")

        context = cls._build_task_context(db, task)
        
        model = PriorityModelFactory.get_model("rule_based")
        score, level, breakdown, rec, exp = model.calculate(context, weights)
        
        prediction = db.scalar(select(AIPriorityPrediction).where(AIPriorityPrediction.task_id == task_id))
        if not prediction:
            prediction = AIPriorityPrediction(
                task_id=task_id,
                model_name=model.model_name,
                model_version=model.model_version
            )
            db.add(prediction)
            
        prediction.priority_score = score
        prediction.priority_level = level
        prediction.factor_breakdown = breakdown
        prediction.recommendation = rec
        prediction.explanation = exp
        
        db.commit()
        db.refresh(prediction)
        return prediction

    @classmethod
    def calculate_batch(cls, db: Session, task_ids: List[str], weights: Dict[str, float] = None) -> List[AIPriorityPrediction]:
        results = []
        for tid in task_ids:
            try:
                res = cls.calculate_priority(db, tid, weights)
                results.append(res)
            except ValueError:
                pass
        return results

    @classmethod
    def get_priority_tasks(cls, db: Session, limit: int = 100) -> List[AIPriorityPrediction]:
        return list(db.scalars(
            select(AIPriorityPrediction)
            .order_by(desc(AIPriorityPrediction.priority_score))
            .limit(limit)
        ))

ai_priority_service = AIPriorityService()
