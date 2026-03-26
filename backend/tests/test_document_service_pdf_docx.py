from __future__ import annotations

import io
from unittest.mock import MagicMock, patch

from app.domain.memory.document_service import DocumentService


@patch("app.domain.memory.document_service.pdf_oxide.PdfDocument")
def test_extract_text_pdf(mock_pdf_doc: MagicMock) -> None:
    mock_doc_instance = MagicMock()
    mock_doc_instance.to_plain_text_all.return_value = "Page 1 Content\nPage 1 Content"
    mock_pdf_doc.from_bytes.return_value = mock_doc_instance

    file = io.BytesIO(b"fake pdf")
    text = DocumentService.extract_text(file, "test.pdf", "application/pdf")

    assert "Page 1 Content\nPage 1 Content" in text


@patch("app.domain.memory.document_service.docx.Document")
def test_extract_text_docx(mock_docx: MagicMock) -> None:
    mock_para = MagicMock()
    mock_para.text = "Paragraph Content"
    mock_doc_instance = MagicMock()
    mock_doc_instance.paragraphs = [mock_para, mock_para]
    mock_docx.return_value = mock_doc_instance

    file = io.BytesIO(b"fake docx")
    text = DocumentService.extract_text(file, "test.docx", "application/msword")

    assert "Paragraph Content\nParagraph Content" in text


def test_extract_text_exception() -> None:
    # Trigger an exception by passing a mocked object that raises when read
    mock_file = MagicMock()
    mock_file.read.side_effect = Exception("Read Error")

    text = DocumentService.extract_text(mock_file, "error.txt", "text/plain")
    assert "Error reading file: error.txt" in text
