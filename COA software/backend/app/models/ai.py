from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, JSON, Index
from sqlalchemy.orm import relationship
from app.database.base import Base, generate_uuid, utc_now

class AssetRiskPrediction(Base):
    __tablename__ = "asset_risk_predictions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    horizon_days = Column(Integer, default=30, nullable=False, index=True)
    risk_score = Column(Float, nullable=False, default=0.0) # 0.0 - 100.0
    risk_level = Column(String(32), nullable=False, index=True)     # LOW, MEDIUM, HIGH, CRITICAL
    failure_probability = Column(Float, nullable=False) # 0.0 - 1.0
    model_name = Column(String(64), nullable=False)
    model_version = Column(String(32), nullable=False)
    features_snapshot = Column(JSON, nullable=True)
    prediction_date = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    recommendation = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    __table_args__ = (
        Index("ix_asset_risk_pred_asset_date", "asset_id", "prediction_date"),
        Index("ix_asset_risk_pred_level_score", "risk_level", "risk_score"),
    )

    asset = relationship("Asset")

    @property
    def feature_snapshot(self):
        return self.features_snapshot

    @feature_snapshot.setter
    def feature_snapshot(self, val):
        self.features_snapshot = val


class AIPrediction(Base):
    __tablename__ = "ai_predictions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    entity_type = Column(String(64), nullable=False, index=True) # ASSET, TRAIN, CORRIDOR
    entity_id = Column(String(64), nullable=False, index=True)
    prediction_type = Column(String(64), nullable=False)
    score = Column(Float, nullable=False)
    model_name = Column(String(64), nullable=False)
    model_version = Column(String(32), nullable=False)
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    @property
    def prediction_value(self) -> float:
        return self.score

    @property
    def confidence(self) -> float:
        return 95.0


class AIRecommendation(Base):
    __tablename__ = "ai_recommendations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    recommendation_type = Column(String(64), nullable=False)
    entity_type = Column(String(64), nullable=False, index=True)
    entity_id = Column(String(64), nullable=False, index=True)
    recommendation = Column(Text, nullable=False)
    confidence = Column(Float, nullable=False, default=90.0)
    factors = Column(JSON, nullable=True)
    constraints = Column(JSON, nullable=True)
    alternatives = Column(JSON, nullable=True)
    expected_impact = Column(Text, nullable=True)
    status = Column(String(32), default="ACTIVE", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
