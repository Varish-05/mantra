from datetime import datetime
from typing import Dict, Any, Optional
from uuid import UUID
from pydantic import BaseModel


class AnalysisRequest(BaseModel):
    content: str
    file_type: str
    metadata: Optional[Dict[str, Any]] = None


class AnalysisResultResponse(BaseModel):
    id: UUID
    document_id: Optional[UUID] = None
    analysis_type: str
    classification: str
    confidence_score: float
    risk_score: float
    predictions_details: Dict[str, Any]
    analyzed_at: datetime

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_documents: int
    malicious_count: int
    suspicious_count: int
    benign_count: int
    avg_risk_score: float
    threat_types: Dict[str, int] # counts by type
