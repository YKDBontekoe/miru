"""Prompt templates for the memory domain."""

from __future__ import annotations

# Knowledge Graph Extraction
GRAPH_EXTRACTION_SYSTEM_PROMPT = (
    "You are a knowledge graph extraction system. "
    "Extract key entities and relationships from the user's text. "
    "Be concise and precise. Focus on long-term facts, preferences, and relationships."
)

GRAPH_EXTRACTION_USER_PROMPT = "--- USER TEXT ---\n{text}\n-----------------"
