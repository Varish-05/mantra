from io import BytesIO
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.analysis import AnalysisResult
from app.models.document import Document
from app.services.report_service import generate_incident_pdf
from app.api import deps
from app.models.user import User

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/generate/{analysis_id}")
async def download_incident_report(
    analysis_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Generate and stream a downloadable Incident PDF Report 
    based on the specified threat analysis log ID.
    """
    try:
        analysis_uuid = uuid.UUID(analysis_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid analysis log UUID format"
        )
        
    # Fetch analysis record
    stmt = select(AnalysisResult).where(AnalysisResult.id == analysis_uuid)
    res = await db.execute(stmt)
    analysis = res.scalars().first()
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis record not found"
        )
        
    # Fetch related document if present
    doc_info = None
    if analysis.document_id:
        doc_stmt = select(Document).where(Document.id == analysis.document_id)
        doc_res = await db.execute(doc_stmt)
        doc = doc_res.scalars().first()
        if doc:
            doc_info = {
                "filename": doc.filename,
                "file_type": doc.file_type
            }
            
    # Calculate virtual risk score
    conf = analysis.confidence_score
    risk_score = round(conf * 100) if analysis.classification != "benign" else round((1 - conf) * 20)
    
    analysis_record = {
        "analysis_type": analysis.analysis_type,
        "classification": analysis.classification,
        "confidence_score": analysis.confidence_score,
        "risk_score": float(risk_score),
        "predictions_details": analysis.predictions_details
    }
    
    # Generate PDF bytes
    try:
        pdf_bytes = generate_incident_pdf(analysis_record, doc_info)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF document layout: {str(e)}"
        )
        
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=mantra_incident_report_{analysis_id[:8]}.pdf"
        }
    )
