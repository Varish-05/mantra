import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.models.document import Document
from app.models.analysis import AnalysisResult
from app.schemas.document import DocumentResponse, SearchRequest, SearchHit, ChatRequest, ChatResponse
from app.services.file_processor import extract_text
from app.services.rag_service import rag_service
from app.services import ml_service
from app.api import deps
from app.models.user import User

router = APIRouter(prefix="/documents", tags=["documents"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker(["Admin", "Security Analyst"]))
):
    """
    Upload and analyze security files (PDF, DOCX, TXT, CSV, JSON, EML, Log).
    Triggers immediate pgvector chunking and ML threat scoring.
    """
    file_bytes = await file.read()
    filename = file.filename
    file_size = len(file_bytes)
    
    # Save file locally
    file_path = os.path.join(UPLOAD_DIR, filename)
    try:
        with open(file_path, "wb") as f:
            f.write(file_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save file locally: {str(e)}"
        )
        
    # Extract file extension
    ext = filename.split(".")[-1].lower()
    
    # Create Document record
    db_doc = Document(
        filename=filename,
        file_type=ext,
        file_size=file_size,
        file_path=file_path,
        status="processing",
        uploaded_by=current_user.id
    )
    db.add(db_doc)
    await db.flush() # flush to generate UUID id
    
    # Extract file text contents
    extracted_text = extract_text(file_bytes, filename)
    
    try:
        # 1. Ingest into RAG pgvector index
        await rag_service.ingest_document(db, db_doc, extracted_text)
        
        # 2. Trigger threat assessment ML model
        # Construct optional malware meta block if JSON file
        meta_block = {}
        if ext == "json":
            try:
                meta_block = json.loads(extracted_text)
            except Exception:
                pass
                
        threat_analysis = ml_service.analyze_threat(
            content=extracted_text,
            file_type=ext,
            meta_info=meta_block
        )
        
        # Save Threat Analysis result to db
        db_analysis = AnalysisResult(
            document_id=db_doc.id,
            analysis_type=threat_analysis["analysis_type"],
            classification=threat_analysis["classification"],
            confidence_score=threat_analysis["confidence_score"],
            predictions_details=threat_analysis["predictions_details"]
        )
        db.add(db_analysis)
        
        db_doc.status = "completed"
        await db.commit()
        await db.refresh(db_doc)
        return db_doc
        
    except Exception as e:
        await db.rollback()
        db_doc.status = "failed"
        db.add(db_doc)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ingestion/Analysis pipeline failed: {str(e)}"
        )


@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Retrieve list of uploaded documents."""
    result = await db.execute(
        select(Document)
        .order_by(desc(Document.created_at))
        .offset(offset)
        .limit(limit)
    )
    return result.scalars().all()


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker(["Admin"]))
):
    """Delete a document and its vector embeddings (Admin only)."""
    import uuid
    doc_uuid = uuid.UUID(id)
    result = await db.execute(select(Document).where(Document.id == doc_uuid))
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
        
    # Delete local file
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass
            
    await db.delete(doc)
    await db.commit()
    return None


@router.post("/search", response_model=List[SearchHit])
async def semantic_search_docs(
    payload: SearchRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Semantic similarity search against cybersecurity document corpora using pgvector."""
    results = await rag_service.semantic_search(
        db=db, 
        query=payload.query, 
        limit=payload.limit or 4
    )
    return results


@router.post("/chat", response_model=ChatResponse)
async def chat_rag(
    payload: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Conversational security analyst RAG: retrieves contextual vectors and creates cited answers."""
    result = await rag_service.generate_response(db=db, query=payload.query)
    return result
