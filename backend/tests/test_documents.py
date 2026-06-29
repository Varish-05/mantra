import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings
from app.models.document import Document
from app.services.rag_service import rag_service


@pytest.mark.asyncio
async def test_document_ingestion_and_search(override_get_db, db_session):
    """Test full document text chunking, pgvector search, and RAG chat endpoints."""
    # 1. Manually insert a document record
    doc = Document(
        filename="threat_manual.txt",
        file_type="txt",
        file_size=500,
        file_path="uploads/threat_manual.txt",
        status="processing"
    )
    db_session.add(doc)
    await db_session.commit()
    
    # 2. Ingest document content (chunking and embedding)
    content = "The Mimikatz security tool is frequently used by attackers to dump credentials from memory. Section two explains mitigation strategies including disabling LSA credentials caching."
    await rag_service.ingest_document(db_session, doc, content)
    
    # 3. Test semantic search matches
    search_hits = await rag_service.semantic_search(db_session, "Mimikatz credentials")
    assert len(search_hits) > 0
    assert search_hits[0]["document_name"] == "threat_manual.txt"
    assert "Mimikatz" in search_hits[0]["content"]
    
    # 4. Test RAG response text generation
    rag_result = await rag_service.generate_response(db_session, "How does Mimikatz affect LSA credentials?")
    assert "response" in rag_result
    assert len(rag_result["citations"]) > 0
    assert rag_result["citations"][0]["document_name"] == "threat_manual.txt"
