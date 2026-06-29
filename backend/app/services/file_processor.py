import io
import json
from typing import List, Dict, Any
from pypdf import PdfReader
from docx import Document as DocxDocument
from email import message_from_string


def parse_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF pages."""
    text = ""
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    except Exception as e:
        text = f"[Error reading PDF: {str(e)}]"
    return text


def parse_docx(file_bytes: bytes) -> str:
    """Extract text from MS Word paragraphs."""
    text = ""
    try:
        doc = DocxDocument(io.BytesIO(file_bytes))
        text = "\n".join([para.text for para in doc.paragraphs])
    except Exception as e:
        text = f"[Error reading DOCX: {str(e)}]"
    return text


def parse_eml(file_bytes: bytes) -> str:
    """Extract headers and text body from .eml format."""
    text = ""
    try:
        raw_eml = file_bytes.decode("utf-8", errors="ignore")
        msg = message_from_string(raw_eml)
        
        headers = []
        for header in ["From", "To", "Subject", "Date"]:
            if msg[header]:
                headers.append(f"{header}: {msg[header]}")
                
        body = ""
        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                if content_type == "text/plain":
                    body_payload = part.get_payload(decode=True)
                    if body_payload:
                        body += body_payload.decode("utf-8", errors="ignore") + "\n"
        else:
            body_payload = msg.get_payload(decode=True)
            if body_payload:
                body = body_payload.decode("utf-8", errors="ignore")
                
        text = "\n".join(headers) + "\n\n" + body
    except Exception as e:
        text = f"[Error reading EML: {str(e)}]"
    return text


def parse_json_log(file_bytes: bytes) -> str:
    """Convert JSON logs to structured text format."""
    try:
        data = json.loads(file_bytes.decode("utf-8", errors="ignore"))
        return json.dumps(data, indent=2)
    except Exception:
        return file_bytes.decode("utf-8", errors="ignore")


def extract_text(file_bytes: bytes, filename: str) -> str:
    """Dispatch file bytes to appropriate text parser based on extension."""
    ext = filename.split(".")[-1].lower()
    
    if ext == "pdf":
        return parse_pdf(file_bytes)
    elif ext in ["docx", "doc"]:
        return parse_docx(file_bytes)
    elif ext == "eml":
        return parse_eml(file_bytes)
    elif ext == "json":
        return parse_json_log(file_bytes)
    else:
        # Default text decode for txt, csv, log
        return file_bytes.decode("utf-8", errors="ignore")


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 150) -> List[str]:
    """Split clean text into overlapping chunks for semantic modeling."""
    chunks = []
    if not text:
        return chunks
        
    words = text.split()
    if len(words) == 0:
        return chunks
        
    # Standard word-based chunking
    i = 0
    while i < len(words):
        chunk_words = words[i : i + chunk_size]
        chunks.append(" ".join(chunk_words))
        # Step forward by chunk_size - overlap
        i += chunk_size - overlap
        if i >= len(words) or len(chunk_words) < overlap:
            break
            
    return chunks
