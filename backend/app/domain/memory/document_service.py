from __future__ import annotations

import logging
from typing import BinaryIO

import docx
import pdf_oxide

logger = logging.getLogger(__name__)


class DocumentService:
    """Service for extracting and processing text from uploaded documents."""

    @staticmethod
    def extract_text(file: BinaryIO, filename: str, content_type: str) -> str:
        """Extracts text content from various file formats.

        Args:
            file: The binary file-like object to read from.
            filename: The name of the file being processed.
            content_type: The MIME type of the file.

        Returns:
            The extracted text as a string, or a placeholder if unsupported.
        """
        text = ""
        try:
            if content_type == "application/pdf" or filename.endswith(".pdf"):
                doc = pdf_oxide.PdfDocument.from_bytes(file.read())
                text = doc.to_plain_text_all()
            elif content_type in [
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/msword",
            ] or filename.endswith(".docx"):
                doc = docx.Document(file)
                text = "\n".join([para.text for para in doc.paragraphs])
            elif content_type.startswith("image/"):
                # Basic placeholder for OCR, could use LLM vision API or tesseract
                # For now, we return a placeholder or use a basic extraction if implemented
                logger.info(f"Image received: {filename}. OCR not fully implemented locally.")
                text = f"[Image: {filename}]"
            elif content_type.startswith("text/") or filename.endswith(".txt"):
                raw_bytes = file.read()
                try:
                    text = raw_bytes.decode("utf-8")
                except UnicodeDecodeError:
                    text = raw_bytes.decode("utf-8", errors="replace")
            else:
                logger.warning(f"Unsupported file type: {content_type}")
                text = f"[Unsupported file type: {filename}]"
        except Exception:
            logger.exception(f"Error extracting text from {filename}")
            text = f"[Error reading file: {filename}]"

        return text.strip()

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list[str]:
        if not text:
            return []

        if chunk_size <= 0:
            raise ValueError("chunk_size must be greater than 0")
        if overlap < 0:
            raise ValueError("overlap must be non-negative")

        overlap = min(overlap, chunk_size - 1)

        words = text.split()
        chunks = []
        i = 0
        step = chunk_size - overlap
        while i < len(words):
            chunk = " ".join(words[i : i + chunk_size])
            chunks.append(chunk)
            i += step
        return chunks
