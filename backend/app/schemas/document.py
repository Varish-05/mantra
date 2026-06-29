from datetime import datetime
from typing import List, Dict, Any, Optional
from uuid import UUID
from pydantic import BaseModel


class DocumentBase(BaseModel):
    filename: str
    file_type: str
    file_size: int
    status: str


class DocumentResponse(DocumentBase):
    id: UUID
    file_path: str
    uploaded_by: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 4


class SearchHit(BaseModel):
    chunk_id: UUID
    document_id: UUID
    document_name: str
    content: str
    chunk_index: int


class ChatRequest(BaseModel):
    query: str


class ChatResponse(BaseModel):
    response: str
    citations: List[SearchHit]
