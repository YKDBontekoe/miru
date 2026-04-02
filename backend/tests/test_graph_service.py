from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.domain.memory.graph_service import (
    GraphEntity,
    GraphExtractionSchema,
    GraphExtractionService,
    GraphRelationship,
)


@pytest.mark.asyncio
async def test_extract_graph_from_text_success() -> None:
    with patch(
        "app.infrastructure.external.openrouter.structured_completion", new_callable=AsyncMock
    ) as mock_structured:
        mock_result = GraphExtractionSchema(
            entities=[GraphEntity(name="Alice", entity_type="Person", description="A friend")],
            relationships=[],
        )
        mock_structured.return_value = mock_result

        result = await GraphExtractionService.extract_graph_from_text("Alice is a friend")
        assert result == mock_result
        mock_structured.assert_called_once()


@pytest.mark.asyncio
async def test_extract_graph_from_text_exception() -> None:
    with patch(
        "app.infrastructure.external.openrouter.structured_completion", new_callable=AsyncMock
    ) as mock_structured:
        mock_structured.side_effect = Exception("API error")

        with patch("app.domain.memory.graph_service.logger.warning") as mock_logger:
            result = await GraphExtractionService.extract_graph_from_text("Alice is a friend")
            assert result is None
            mock_logger.assert_called_once()


@pytest.mark.asyncio
async def test_process_and_store_graph_empty() -> None:
    with patch.object(
        GraphExtractionService, "extract_graph_from_text", new_callable=AsyncMock
    ) as mock_extract:
        mock_extract.return_value = None
        await GraphExtractionService.process_and_store_graph("text", uuid.uuid4())
        mock_extract.assert_called_once()


@pytest.mark.asyncio
async def test_process_and_store_graph_success() -> None:
    with patch.object(
        GraphExtractionService, "extract_graph_from_text", new_callable=AsyncMock
    ) as mock_extract:
        user_id = uuid.uuid4()

        mock_extract.return_value = GraphExtractionSchema(
            entities=[
                GraphEntity(name="Alice", entity_type="Person", description="A friend"),
                GraphEntity(name="Bob", entity_type="Person", description="A brother"),
            ],
            relationships=[
                GraphRelationship(source="Alice", target="Bob", relationship="KNOWS", weight=0.5)
            ],
        )

        mock_node_alice = MagicMock()
        mock_node_alice.id = uuid.uuid4()
        mock_node_alice.name = "Alice"
        mock_node_alice.description = "A friend"
        mock_node_alice.save = AsyncMock()

        mock_node_bob = MagicMock()
        mock_node_bob.id = uuid.uuid4()
        mock_node_bob.name = "Bob"
        mock_node_bob.description = "A brother"
        mock_node_bob.save = AsyncMock()

        mock_edge = MagicMock()
        mock_edge.source_node_id = mock_node_alice.id
        mock_edge.target_node_id = mock_node_bob.id
        mock_edge.relationship = "KNOWS"
        mock_edge.weight = 0.5
        mock_edge.save = AsyncMock()

        with (
            patch("app.domain.memory.models.MemoryGraphNode.filter") as mock_node_filter,
            patch(
                "app.domain.memory.models.MemoryGraphNode.bulk_create", new_callable=AsyncMock
            ) as mock_node_bulk_create,
            patch(
                "app.domain.memory.models.MemoryGraphNode.bulk_update", new_callable=AsyncMock
            ) as mock_node_bulk_update,
            patch("app.domain.memory.models.MemoryGraphEdge.filter") as mock_edge_filter,
            patch(
                "app.domain.memory.models.MemoryGraphEdge.bulk_create", new_callable=AsyncMock
            ) as mock_edge_bulk_create,
            patch(
                "app.domain.memory.models.MemoryGraphEdge.bulk_update", new_callable=AsyncMock
            ) as mock_edge_bulk_update,
        ):
            # Setup node fetch to return Alice as existing, Bob as missing so Alice gets an update
            # because description differs if we test it right
            mock_node_filter_query = AsyncMock()
            mock_node_filter_query.all.side_effect = [
                [mock_node_alice],  # First fetch (existing nodes)
                [mock_node_bob],  # Second fetch (refetch after create)
            ]
            mock_node_filter.return_value = mock_node_filter_query

            # Alice's description in the mock is "A friend". The extracted description is "A friend".
            # To trigger update, let's make the extracted one different.

            # Actually, to make mock_node_bulk_update be called, description must not be in str(node.description).
            # Let's change Alice's mock description.
            mock_node_alice.description = "Old description"

            # Setup edge fetch to return the edge as existing
            mock_edge_filter_query = AsyncMock()
            mock_edge_filter_query.all.return_value = [mock_edge]
            mock_edge_filter.return_value = mock_edge_filter_query

            await GraphExtractionService.process_and_store_graph("text", user_id)

            assert mock_node_bulk_create.call_count == 1
            assert mock_node_bulk_update.call_count == 1
            assert mock_edge_bulk_create.call_count == 0
            assert mock_edge_bulk_update.call_count == 1
            assert mock_edge.weight == 0.6
