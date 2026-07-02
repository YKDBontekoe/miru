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


def test_extract_text_txt_latin1() -> None:
    import io

    from app.domain.memory.document_service import DocumentService

    # Invalid UTF-8 but valid bytes
    file = io.BytesIO(b"Hello \xff World")
    text = DocumentService.extract_text(file, "test.txt", "text/plain")
    assert "Hello" in text
    assert "World" in text


def test_chunk_text_zero_chunk_size() -> None:
    import pytest
    from app.domain.memory.document_service import DocumentService

    with pytest.raises(ValueError, match="chunk_size must be greater than 0"):
        DocumentService.chunk_text("test", chunk_size=0)


def test_chunk_text_negative_overlap() -> None:
    import pytest
    from app.domain.memory.document_service import DocumentService

    with pytest.raises(ValueError, match="overlap must be non-negative"):
        DocumentService.chunk_text("test", overlap=-1)


def test_chunk_text_large_overlap() -> None:
    from app.domain.memory.document_service import DocumentService

    chunks = DocumentService.chunk_text("a b c d", chunk_size=2, overlap=10)
    assert len(chunks) == 4
