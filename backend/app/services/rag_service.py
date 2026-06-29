from typing import List, Dict, Any, Optional
import os
import numpy as np
from sentence_transformers import SentenceTransformer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
import google.generativeai as genai

from app.core.config import settings
from app.models.document import Document, DocumentChunk


class RAGService:
    def __init__(self):
        self._model = None

    @property
    def model(self) -> SentenceTransformer:
        """Lazy loads SentenceTransformer to save memory during startup."""
        if self._model is None:
            # Uses 384 dimensional local MiniLM model
            # If offline, it reads from cache, or downloads once on initial boot
            self._model = SentenceTransformer("all-MiniLM-L6-v2")
        return self._model

    def embed_text(self, text: str) -> List[float]:
        """Generate high-dimensional vector embeddings for input text."""
        emb = self.model.encode(text)
        return emb.tolist()

    async def ingest_document(self, db: AsyncSession, document: Document, text: str):
        """Processes, chunks, embeds, and saves document contents to pgvector."""
        from app.services.file_processor import chunk_text
        
        chunks = chunk_text(text)
        if not chunks:
            # If file was empty, make one empty placeholder chunk
            chunks = ["(Empty document content)"]
            
        for idx, chunk_content in enumerate(chunks):
            embedding = self.embed_text(chunk_content)
            
            db_chunk = DocumentChunk(
                document_id=document.id,
                content=chunk_content,
                embedding=embedding,
                meta_data={"filename": document.filename, "file_type": document.file_type},
                chunk_index=idx
            )
            db.add(db_chunk)
            
        document.status = "completed"
        await db.commit()

    async def semantic_search(
        self, 
        db: AsyncSession, 
        query: str, 
        limit: int = 4
    ) -> List[Dict[str, Any]]:
        """Queries pgvector database using L2 / Cosine similarity distance operator."""
        query_vector = self.embed_text(query)
        
        # Select chunks, order by cosine distance
        # SQLAlchemy pgvector syntax
        stmt = (
            select(DocumentChunk)
            .order_by(DocumentChunk.embedding.cosine_distance(query_vector))
            .limit(limit)
        )
        result = await db.execute(stmt)
        chunks = result.scalars().all()
        
        # Load related document names for citation formatting
        hits = []
        for chunk in chunks:
            doc_stmt = select(Document).where(Document.id == chunk.document_id)
            doc_res = await db.execute(doc_stmt)
            doc = doc_res.scalars().first()
            doc_name = doc.filename if doc else "Unknown Source"
            
            hits.append({
                "chunk_id": chunk.id,
                "document_id": chunk.document_id,
                "document_name": doc_name,
                "content": chunk.content,
                "chunk_index": chunk.chunk_index
            })
        return hits

    async def generate_response(
        self, 
        db: AsyncSession, 
        query: str
    ) -> Dict[str, Any]:
        """Retrieves contexts from pgvector database and drafts answers with citations."""
        # 1. Retrieve top contexts
        sources = await self.semantic_search(db, query, limit=3)
        
        if not sources:
            return {
                "response": "I could not find any relevant security documents in the database to answer your request. Please upload cybersecurity files (PDFs, network logs, EMLs) first.",
                "citations": []
            }
            
        # Format the context block
        context_block = ""
        for idx, src in enumerate(sources):
            context_block += f"Source [{idx + 1}] (Document: {src['document_name']}):\n{src['content']}\n\n"
            
        prompt = (
            f"You are MANTRA, an elite Cybersecurity Threat Response assistant.\n"
            f"Use the following document segments to answer the user's query.\n"
            f"You MUST cite your sources using bracket notation corresponding to the source numbers (e.g. [1], [2]).\n"
            f"If the context does not contain enough information, explain that limitations apply but summarize the closest facts.\n\n"
            f"--- CONTEXT ---\n{context_block}\n"
            f"--- USER QUERY ---\n{query}\n\n"
            f"Answer:"
        )
        
        # 2. Generate text (External Gemini API vs local fallback logic)
        response_text = ""
        used_gemini = False
        
        if settings.GEMINI_API_KEY:
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                model = genai.GenerativeModel("gemini-1.5-flash")
                response = model.generate_content(prompt)
                response_text = response.text
                used_gemini = True
            except Exception as e:
                response_text = f"[Gemini API Call failed: {str(e)}]\n\n"
                
        if not used_gemini:
            # Fallback offline local processor: constructs a high-fidelity summary from the contexts
            # Extracted lines containing keywords or simply summarizing the retrieved nodes.
            summary_sentences = []
            for idx, src in enumerate(sources):
                # Grab first two sentences of chunk as a summary
                sentences = [s.strip() for s in src["content"].split(".") if s.strip()]
                summary_excerpt = ". ".join(sentences[:2])
                summary_sentences.append(f"Regarding the query, '{query}', the threat document '{src['document_name']}' indicates: \"{summary_excerpt}.\" [{idx + 1}]")
                
            response_text = " (Offline Security Assistant Response)\n\n" + "\n\n".join(summary_sentences)
            
        return {
            "response": response_text,
            "citations": sources
        }


# Initialize globally
rag_service = RAGService()
