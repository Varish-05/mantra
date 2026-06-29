from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.core.database import get_db
from app.models.analysis import AnalysisResult
from app.models.document import Document
from app.schemas.analysis import AnalysisRequest, AnalysisResultResponse, DashboardStats
from app.services import ml_service
from app.api import deps
from app.models.user import User

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post("/run", response_model=AnalysisResultResponse, status_code=status.HTTP_201_CREATED)
async def run_analysis(
    payload: AnalysisRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker(["Admin", "Security Analyst"]))
):
    """
    Submits content features for threat classification.
    Only Admins and Security Analysts can execute threat scans.
    """
    try:
        # Run ML model pipeline
        res = ml_service.analyze_threat(
            content=payload.content,
            file_type=payload.file_type,
            meta_info=payload.metadata
        )
        
        # Save to database
        db_res = AnalysisResult(
            analysis_type=res["analysis_type"],
            classification=res["classification"],
            confidence_score=res["confidence_score"],
            predictions_details=res["predictions_details"],
            # If document ID is passed in metadata, tie it
            document_id=payload.metadata.get("document_id") if payload.metadata else None
        )
        db.add(db_res)
        await db.commit()
        await db.refresh(db_res)
        
        # Format custom response (injecting virtual risk_score for output API schema compatibility)
        return {
            "id": db_res.id,
            "document_id": db_res.document_id,
            "analysis_type": db_res.analysis_type,
            "classification": db_res.classification,
            "confidence_score": db_res.confidence_score,
            "risk_score": res["risk_score"],
            "predictions_details": db_res.predictions_details,
            "analyzed_at": db_res.analyzed_at
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )


@router.get("/results", response_model=List[AnalysisResultResponse])
async def list_results(
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user) # Viewer can access
):
    """List recent threat analysis logs."""
    result = await db.execute(
        select(AnalysisResult)
        .order_by(desc(AnalysisResult.analyzed_at))
        .offset(offset)
        .limit(limit)
    )
    records = result.scalars().all()
    
    # Calculate virtual risk_score on-the-fly for response formatting
    response = []
    for r in records:
        conf = r.confidence_score
        c_score = round(conf * 100) if r.classification != "benign" else round((1 - conf) * 20)
        response.append({
            "id": r.id,
            "document_id": r.document_id,
            "analysis_type": r.analysis_type,
            "classification": r.classification,
            "confidence_score": r.confidence_score,
            "risk_score": float(c_score),
            "predictions_details": r.predictions_details,
            "analyzed_at": r.analyzed_at
        })
    return response


@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Aggregate statistics for dashboard metrics."""
    # Count totals by classification
    class_query = await db.execute(
        select(AnalysisResult.classification, func.count(AnalysisResult.id))
        .group_by(AnalysisResult.classification)
    )
    class_counts = dict(class_query.all())
    
    # Count by type
    type_query = await db.execute(
        select(AnalysisResult.analysis_type, func.count(AnalysisResult.id))
        .group_by(AnalysisResult.analysis_type)
    )
    type_counts = dict(type_query.all())
    
    # Document totals
    doc_count_query = await db.execute(select(func.count(Document.id)))
    total_docs = doc_count_query.scalar() or 0
    
    # Calculate Average Confidence/Risk
    avg_conf_query = await db.execute(select(func.avg(AnalysisResult.confidence_score)))
    avg_conf = avg_conf_query.scalar() or 0.0
    
    malicious = class_counts.get("malicious", 0)
    suspicious = class_counts.get("suspicious", 0)
    benign = class_counts.get("benign", 0)
    total_analyses = malicious + suspicious + benign
    
    avg_risk = 0.0
    if total_analyses > 0:
        # Weighted simple mapping for virtual average risk
        avg_risk = ((malicious * 85) + (suspicious * 45) + (benign * 12)) / total_analyses
        
    return {
        "total_documents": total_docs,
        "malicious_count": malicious,
        "suspicious_count": suspicious,
        "benign_count": benign,
        "avg_risk_score": float(avg_risk),
        "threat_types": {k: int(v) for k, v in type_counts.items()}
    }
