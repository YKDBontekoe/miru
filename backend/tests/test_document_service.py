from __future__ import annotations

import io

from app.domain.memory.document_service import DocumentService


def test_extract_text_txt() -> None:
    file = io.BytesIO(b"Hello World")
    text = DocumentService.extract_text(file, "test.txt", "text/plain")
    assert text == "Hello World"


def test_extract_text_unsupported() -> None:
    file = io.BytesIO(b"01010101")
    text = DocumentService.extract_text(file, "test.bin", "application/octet-stream")
    assert "Unsupported file type" in text


def test_extract_text_image() -> None:
    file = io.BytesIO(b"fake image data")
    text = DocumentService.extract_text(file, "image.jpg", "image/jpeg")
    assert "[Image: image.jpg]" in text


def test_chunk_text_empty() -> None:
    chunks = DocumentService.chunk_text("")
    assert chunks == []


def test_chunk_text_short() -> None:
    text = "Short sentence"
    chunks = DocumentService.chunk_text(text, chunk_size=10, overlap=2)
    assert len(chunks) == 1
    assert chunks[0] == "Short sentence"


def test_chunk_text_long() -> None:
    words = [str(i) for i in range(15)]
    text = " ".join(words)
    chunks = DocumentService.chunk_text(text, chunk_size=10, overlap=5)
    assert len(chunks) == 3
    assert " ".join(words[:10]) in chunks[0]
    assert " ".join(words[5:15]) in chunks[1]
