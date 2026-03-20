import logging
from typing import BinaryIO

import docx
import pypdf

logger = logging.getLogger(__name__)


class DocumentService:
    @staticmethod
    def extract_text(file: BinaryIO, filename: str, content_type: str) -> str:
        text = ""
        try:
            if content_type == "application/pdf" or filename.endswith(".pdf"):
                reader = pypdf.PdfReader(file)
                for page in reader.pages:
                    text += page.extract_text() + "\n"
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
                text = file.read().decode("utf-8")
            else:
                logger.warning(f"Unsupported file type: {content_type}")
                text = f"[Unsupported file type: {filename}]"
        except Exception as e:
            logger.error(f"Error extracting text from {filename}: {e}")
            text = f"[Error reading file: {filename}]"

        return text.strip()

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list[str]:
        if not text:
            return []

        words = text.split()
        chunks = []
        i = 0
        while i < len(words):
            chunk = " ".join(words[i : i + chunk_size])
            chunks.append(chunk)
            i += chunk_size - overlap
        return chunks
