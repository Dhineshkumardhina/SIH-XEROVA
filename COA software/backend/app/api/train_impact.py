from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.dependencies import require_authenticated_user
from app.models.user import User
from app.services.train_impact_service import train_impact_service
from app.schemas.train_impact import TrainImpactRequest, TrainImpactResponse, TrainImpactData
from app.core.exceptions import ResourceNotFoundError

router = APIRouter(prefix="/train-impact", tags=["AI Train Impact Engine"])


@router.post("", response_model=TrainImpactResponse, summary="Calculate train impact for candidate block window")
def calculate_train_impact(
    payload: TrainImpactRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    try:
        data = train_impact_service.calculate_train_impact(
            db=db,
            corridor_id=payload.corridor_id,
            start_time=payload.start_time,
            end_time=payload.end_time
        )
        return TrainImpactResponse(
            data=TrainImpactData(**data),
            message="Train impact calculated successfully"
        )
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Impact calculation error: {str(e)}")


@router.post("/blocks/requests/{request_id}", response_model=TrainImpactResponse, summary="Calculate & persist impact for a block request")
def calculate_block_request_impact(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    try:
        data = train_impact_service.calculate_block_train_impact(
            db=db,
            block_request_id=request_id
        )
        return TrainImpactResponse(
            data=TrainImpactData(**data),
            message="Block request train impact calculated and saved"
        )
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Block impact calculation error: {str(e)}")
