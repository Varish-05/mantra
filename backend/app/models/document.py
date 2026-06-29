import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from app.core.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # "pdf", "docx", "txt", "csv", "json", "eml", "log"
    file_size = Column(Integer, nullable=False)
    file_path = Column(String, nullable=False)
    status = Column(String, default="pending", nullable=False)  # "pending", "processing", "completed", "failed"
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    uploader = relationship("User", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
    analysis_results = relationship("AnalysisResult", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(384), nullable=True)  # 384 dimensions for all-MiniLM-L6-v2 embeddings
    meta_data = Column(JSONB, default=dict, nullable=False)
    chunk_index = Column(Integer, nullable=False)

    # Relationships
    document = relationship("Document", back_populates="chunks")
