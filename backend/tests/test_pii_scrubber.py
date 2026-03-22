"""Test for PII scrubber."""

from app.core.pii_scrubber import scrub_messages, scrub_pii


def test_scrub_pii() -> None:
    text = "My email is test@example.com, my number is (800) 555-0199, and I live at 123 Main St."
    scrubbed = scrub_pii(text)
    assert "[EMAIL]" in scrubbed
    assert "[PHONE]" in scrubbed
    assert "[ADDRESS]" in scrubbed
    assert "test@example.com" not in scrubbed
    assert "(800) 555-0199" not in scrubbed
    assert "123 Main St" not in scrubbed


def test_scrub_messages() -> None:
    messages = [
        {"role": "user", "content": "My phone is 800-555-0199."},
        {
            "role": "assistant",
            "content": [
                {"type": "text", "text": "Got it, your phone is 800-555-0199 and email is x@y.com."}
            ],
        },
    ]
    scrubbed = scrub_messages(messages)  # type: ignore[arg-type]
    assert scrubbed[0]["content"] == "My phone is [PHONE]."
    assert scrubbed[1]["content"][0]["text"] == "Got it, your phone is [PHONE] and email is [EMAIL]."  # type: ignore[index]
