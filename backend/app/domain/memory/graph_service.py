from __future__ import annotations

import logging
from uuid import UUID

from app.domain.memory.models import MemoryGraphEdge, MemoryGraphNode
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class GraphEntity(BaseModel):
    name: str = Field(description="The name of the entity, e.g., 'John', 'Paris', 'Guitar'")
    entity_type: str = Field(
        description="The type of the entity, e.g., 'Person', 'Location', 'Preference', 'Object'"
    )
    description: str = Field(description="A brief description of the entity based on the context")


class GraphRelationship(BaseModel):
    source: str = Field(description="The exact name of the source entity")
    target: str = Field(description="The exact name of the target entity")
    relationship: str = Field(
        description="The relationship type, e.g., 'LIKES', 'VISITED', 'OWNS', 'IS_A'"
    )
    weight: float = Field(default=0.1, description="The strength of the relationship (0.0 to 1.0)")


class GraphExtractionSchema(BaseModel):
    entities: list[GraphEntity] = Field(
        default_factory=list, description="List of extracted entities"
    )
    relationships: list[GraphRelationship] = Field(
        default_factory=list, description="List of relationships between the extracted entities"
    )


class GraphExtractionService:
    @staticmethod
    async def extract_graph_from_text(text: str) -> GraphExtractionSchema | None:
        """Use LLM structured output to extract graph nodes and edges from text."""
        try:
            from app.infrastructure.external.openrouter import \
                structured_completion

            # Using gpt-4o-mini for fast/cheap structured extraction
            return await structured_completion(
                messages=[
                    {
                        "role": "system",
                        "content": "You are a knowledge graph extraction system. Extract key entities and relationships from the user's text. Be concise and precise. Focus on long-term facts, preferences, and relationships.",
                    },
                    {
                        "role": "user",
                        "content": text,
                    },
                ],
                response_model=GraphExtractionSchema,
                model="gpt-4o-mini",
            )
        except Exception:
            logger.warning("Graph extraction failed", exc_info=True)
            return None

    @staticmethod
    async def process_and_store_graph(text: str, user_id: UUID) -> None:
        """Extract graph elements from text and store them in the database."""
        extraction = await GraphExtractionService.extract_graph_from_text(text)
        if not extraction or not extraction.entities:
            return

        try:
            # 1. Upsert Nodes
            node_map: dict[str, MemoryGraphNode] = {}
            for entity in extraction.entities:
                # Atomic get_or_create to prevent race conditions
                node, created = await MemoryGraphNode.get_or_create(
                    user_id=user_id,
                    name=entity.name,
                    defaults={
                        "entity_type": entity.entity_type,
                        "description": entity.description,
                    },
                )
                # Append description if it's new information
                if not created and entity.description not in str(node.description):
                    node.description = f"{node.description}\n{entity.description}".strip()
                    await node.save()

                node_map[entity.name.lower()] = node

            # 2. Upsert Edges
            for rel in extraction.relationships:
                source_node = node_map.get(rel.source.lower())
                target_node = node_map.get(rel.target.lower())

                if source_node and target_node:
                    # Atomic get_or_create to prevent race conditions
                    edge, created = await MemoryGraphEdge.get_or_create(
                        source_node=source_node,
                        target_node=target_node,
                        relationship=rel.relationship,
                        defaults={
                            "weight": rel.weight,
                        },
                    )

                    if not created:
                        # Strengthen existing relationship
                        edge.weight = min(1.0, edge.weight + 0.1)
                        await edge.save()

        except Exception:
            logger.warning("Failed to store graph elements", exc_info=True)
