"""PII Scrubber for masking sensitive information before sending to external APIs."""

from __future__ import annotations

import re
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from openai.types.chat import ChatCompletionMessageParam


def scrub_pii(text: str) -> str:
    """Mask emails, phone numbers, and common addresses in text."""
    # SEC(agent): Remediation for Area Data Privacy Vulnerability: PII Leakage Risk: Sensitive user info could be logged or sent to third-party LLMs without consent
    # Mask emails
    text = re.sub(r"[\w\.-]+@[\w\.-]+\.\w+", "[EMAIL]", text)
    # Mask phone numbers (basic formats: +1-800-555-0199, (800) 555-0199, 800-555-0199)
    text = re.sub(r"\b(?:\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b", "[PHONE]", text)
    # Mask addresses (basic formats ending in common street types)
    text = re.sub(
        r"\b\d{1,5}\s(?:[A-Za-z0-9#.-]+\s){1,5}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way)\b",
        "[ADDRESS]",
        text,
        flags=re.IGNORECASE,
    )
    return text


def scrub_messages(messages: list[ChatCompletionMessageParam]) -> list[ChatCompletionMessageParam]:
    """Scrub PII from a list of chat completion messages."""
    scrubbed_messages: list[ChatCompletionMessageParam] = []
    for msg in messages:
        msg_copy = dict(msg)
        content = msg_copy.get("content")
        if isinstance(content, str):
            msg_copy["content"] = scrub_pii(content)
        elif isinstance(content, list):
            # Handle list of parts (e.g., text and image)
            new_content = []
            for part in content:
                if (
                    isinstance(part, dict)
                    and part.get("type") == "text"
                    and isinstance(part.get("text"), str)
                ):
                    new_part = dict(part)
                    new_part["text"] = scrub_pii(new_part["text"])
                    new_content.append(new_part)
                else:
                    new_content.append(part)
            msg_copy["content"] = new_content
        scrubbed_messages.append(msg_copy)  # type: ignore[arg-type]
    return scrubbed_messages
