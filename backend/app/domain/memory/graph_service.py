from __future__ import annotations

import logging
from uuid import UUID

from pydantic import BaseModel, Field

from app.domain.memory.models import MemoryGraphEdge, MemoryGraphNode

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
            from app.infrastructure.external.openrouter import structured_completion

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
        # Performance Log: Eradicating N+1 queries by fetching existing nodes/edges with in_ clauses and bulk inserting/updating.
        # Complexity Delta: O(N) database operations reduced to O(1) batched roundtrips for nodes and edges.
        extraction = await GraphExtractionService.extract_graph_from_text(text)
        if not extraction or not extraction.entities:
            return

        try:
            # 1. Upsert Nodes
            node_map: dict[str, MemoryGraphNode] = {}
            entity_names = [e.name for e in extraction.entities]

            existing_nodes = await MemoryGraphNode.filter(
                user_id=user_id, name__in=entity_names
            ).all()

            existing_node_map = {n.name.lower(): n for n in existing_nodes}
            nodes_to_create = []
            nodes_to_update = []

            for entity in extraction.entities:
                key = entity.name.lower()
                if key in existing_node_map:
                    node = existing_node_map[key]
                    if entity.description not in str(node.description):
                        node.description = f"{node.description}\n{entity.description}".strip()
                        nodes_to_update.append(node)
                    node_map[key] = node
                else:
                    new_node = MemoryGraphNode(
                        user_id=user_id,
                        name=entity.name,
                        entity_type=entity.entity_type,
                        description=entity.description,
                    )
                    nodes_to_create.append(new_node)
                    node_map[key] = new_node

            if nodes_to_create:
                await MemoryGraphNode.bulk_create(nodes_to_create)
                # Bulk create doesn't populate IDs securely for all backends, but Tortoise returns them in PostgreSQL.
                # Just in case, re-fetch to ensure we have valid objects for edge mapping
                new_names = [n.name for n in nodes_to_create]
                created_nodes = await MemoryGraphNode.filter(user_id=user_id, name__in=new_names).all()
                for n in created_nodes:
                    node_map[n.name.lower()] = n
                    existing_node_map[n.name.lower()] = n

            if nodes_to_update:
                await MemoryGraphNode.bulk_update(nodes_to_update, fields=["description"])

            # 2. Upsert Edges
            if not extraction.relationships:
                return

            # Gather valid source/target pairs
            valid_rels = []
            edge_queries = []
            for rel in extraction.relationships:
                source_node = node_map.get(rel.source.lower())
                target_node = node_map.get(rel.target.lower())
                if source_node and target_node:
                    valid_rels.append((source_node, target_node, rel))
                    edge_queries.append(f"{source_node.id}_{target_node.id}_{rel.relationship}")

            if not valid_rels:
                return

            # Since Tortoise lacks multi-column IN easily, we iterate or use OR (limited size).
            # For typical extraction sizes (1-20), a combined lookup works, or just query all edges between these nodes.
            source_ids = [s.id for s, t, r in valid_rels]
            target_ids = [t.id for s, t, r in valid_rels]
            rel_types = [r.relationship for s, t, r in valid_rels]

            existing_edges = await MemoryGraphEdge.filter(
                source_node_id__in=source_ids,
                target_node_id__in=target_ids,
                relationship__in=rel_types
            ).all()

            existing_edge_map = {
                f"{e.source_node_id}_{e.target_node_id}_{e.relationship}": e
                for e in existing_edges
            }

            edges_to_create = []
            edges_to_update = []

            for source_node, target_node, rel in valid_rels:
                key = f"{source_node.id}_{target_node.id}_{rel.relationship}"
                if key in existing_edge_map:
                    edge = existing_edge_map[key]
                    edge.weight = min(1.0, edge.weight + 0.1)
                    edges_to_update.append(edge)
                else:
                    new_edge = MemoryGraphEdge(
                        source_node=source_node,
                        target_node=target_node,
                        relationship=rel.relationship,
                        weight=rel.weight
                    )
                    edges_to_create.append(new_edge)
                    existing_edge_map[key] = new_edge

            if edges_to_create:
                await MemoryGraphEdge.bulk_create(edges_to_create)

            if edges_to_update:
                await MemoryGraphEdge.bulk_update(edges_to_update, fields=["weight"])

        except Exception:
            logger.warning("Failed to store graph elements", exc_info=True)
