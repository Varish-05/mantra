import uuid
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=True)
    analysis_type = Column(String, nullable=False)  # "malware", "phishing", "network_anomaly"
    classification = Column(String, nullable=False)  # "benign", "malicious", "suspicious"
    confidence_score = Column(Float, nullable=False)
    predictions_details = Column(JSONB, default=dict, nullable=False)  # Explanations, SHAP attributions, feature scores
    analyzed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    document = relationship("Document", back_populates="analysis_results")


class ThreatIntelCache(Base):
    __tablename__ = "threat_intel_cache"

    cve_id = Column(String, primary_key=True)
    description = Column(String, nullable=False)
    cvss_score = Column(Float, nullable=True)
    mitre_techniques = Column(JSONB, default=list, nullable=False)  # e.g., ["T1566", "T1190"]
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
