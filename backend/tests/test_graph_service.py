from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.domain.memory.graph_service import (GraphEntity,
                                             GraphExtractionSchema,
                                             GraphExtractionService,
                                             GraphRelationship)


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
        mock_node_alice.description = "A friend"
        mock_node_alice.save = AsyncMock()

        mock_node_bob = MagicMock()
        mock_node_bob.description = "A brother"
        mock_node_bob.save = AsyncMock()

        mock_edge = MagicMock()
        mock_edge.weight = 0.5
        mock_edge.save = AsyncMock()

        with (
            patch(
                "app.domain.memory.models.MemoryGraphNode.get_or_create", new_callable=AsyncMock
            ) as mock_node_create,
            patch(
                "app.domain.memory.models.MemoryGraphEdge.get_or_create", new_callable=AsyncMock
            ) as mock_edge_create,
        ):
            mock_node_create.side_effect = [(mock_node_alice, True), (mock_node_bob, False)]

            mock_edge_create.return_value = (mock_edge, False)

            await GraphExtractionService.process_and_store_graph("text", user_id)

            assert mock_node_create.call_count == 2
            assert mock_edge_create.call_count == 1
            mock_edge.save.assert_called_once()
            assert mock_edge.weight == 0.6
