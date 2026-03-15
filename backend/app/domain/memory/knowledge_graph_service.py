"""Knowledge graph extraction service: entities + relationships from chat turns."""

from __future__ import annotations

import logging
import uuid
from uuid import UUID

from pydantic import BaseModel

from app.infrastructure.external.openrouter import structured_completion

logger = logging.getLogger(__name__)


class _Entity(BaseModel):
    name: str
    entity_type: str  # e.g. "person", "place", "concept"
    description: str | None = None


class _Relation(BaseModel):
    from_entity: str
    to_entity: str
    relationship: str  # e.g. "works_at", "likes", "knows"


class _ExtractionResult(BaseModel):
    entities: list[_Entity] = []
    relations: list[_Relation] = []


async def extract_and_store_graph(
    text: str,
    user_id: UUID,
) -> None:
    """Extract entities and relationships from text and persist to the knowledge graph.

    Uses an LLM to identify named entities and relationships, then upserts them
    into ``memory_graph_nodes`` and ``memory_graph_edges`` with deduplication via
    ``ON CONFLICT`` clauses.
    """
    try:
        result: _ExtractionResult = await structured_completion(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an information extraction engine. "
                        "Extract named entities (people, places, concepts, organizations) "
                        "and meaningful relationships between them from the given text. "
                        "Be concise. Only extract clearly stated facts."
                    ),
                },
                {"role": "user", "content": f"Extract entities and relations from:\n\n{text}"},
            ],
            response_model=_ExtractionResult,
        )
    except Exception as exc:
        logger.warning("Knowledge graph extraction failed: %s", exc)
        return

    if not result.entities:
        return

    from tortoise import Tortoise

    conn = Tortoise.get_connection("default")
    entity_name_to_id: dict[str, UUID] = {}

    for entity in result.entities:
        try:
            node_id = str(uuid.uuid4())
            rows = await conn.execute_query_dict(
                """
                INSERT INTO memory_graph_nodes (id, user_id, name, entity_type, description, meta)
                VALUES ($1::uuid, $2::uuid, $3, $4, $5, '{}'::jsonb)
                ON CONFLICT (user_id, name, entity_type) DO UPDATE
                  SET description = EXCLUDED.description
                RETURNING id
                """,
                [node_id, str(user_id), entity.name, entity.entity_type, entity.description],
            )
            if rows:
                entity_name_to_id[entity.name] = UUID(str(rows[0]["id"]))
        except Exception as exc:
            logger.warning("Failed to upsert graph node '%s': %s", entity.name, exc)

    for rel in result.relations:
        src_id = entity_name_to_id.get(rel.from_entity)
        tgt_id = entity_name_to_id.get(rel.to_entity)
        if not src_id or not tgt_id:
            continue
        try:
            edge_id = str(uuid.uuid4())
            await conn.execute_query(
                """
                INSERT INTO memory_graph_edges
                    (id, source_node_id, target_node_id, relationship, meta)
                VALUES ($1::uuid, $2::uuid, $3::uuid, $4, '{}'::jsonb)
                ON CONFLICT (source_node_id, target_node_id, relationship) DO NOTHING
                """,
                [edge_id, str(src_id), str(tgt_id), rel.relationship],
            )
        except Exception as exc:
            logger.warning("Failed to insert graph edge: %s", exc)
