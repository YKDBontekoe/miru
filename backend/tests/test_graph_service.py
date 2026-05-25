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
        await GraphExtractionService.process_and_store_graph(
            "text", uuid.UUID("e0a63418-6320-46e1-83b2-0a025a313ab9")
        )
        mock_extract.assert_called_once()


@pytest.mark.asyncio
async def test_process_and_store_graph_success() -> None:
    with patch.object(
        GraphExtractionService, "extract_graph_from_text", new_callable=AsyncMock
    ) as mock_extract:
        user_id = uuid.UUID("039be943-f742-4bd9-a24a-38297940be4b")

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


@pytest.mark.asyncio
async def test_process_and_store_graph_success_appends_description() -> None:
    with patch.object(
        GraphExtractionService, "extract_graph_from_text", new_callable=AsyncMock
    ) as mock_extract:
        user_id = uuid.UUID("534f7504-960c-4c9c-97a4-4125924ec470")

        mock_extract.return_value = GraphExtractionSchema(
            entities=[
                GraphEntity(name="Alice", entity_type="Person", description="A coworker"),
            ],
            relationships=[],
        )

        mock_node_alice = MagicMock()
        mock_node_alice.description = "A friend"
        mock_node_alice.save = AsyncMock()

        with patch(
            "app.domain.memory.models.MemoryGraphNode.get_or_create", new_callable=AsyncMock
        ) as mock_node_create:
            # Return created=False to trigger the description append logic
            mock_node_create.side_effect = [(mock_node_alice, False)]

            await GraphExtractionService.process_and_store_graph("text", user_id)

            assert mock_node_create.call_count == 1
            # Description should be appended
            assert mock_node_alice.description == "A friend\nA coworker"
            mock_node_alice.save.assert_called_once()


@pytest.mark.asyncio
async def test_process_and_store_graph_handles_exception() -> None:
    with patch.object(
        GraphExtractionService, "extract_graph_from_text", new_callable=AsyncMock
    ) as mock_extract:
        user_id = uuid.UUID("afd63ec0-71e7-4396-a666-0a4a5f94b07d")

        mock_extract.return_value = GraphExtractionSchema(
            entities=[
                GraphEntity(name="Alice", entity_type="Person", description="A friend"),
            ],
            relationships=[],
        )

        with (
            patch(
                "app.domain.memory.models.MemoryGraphNode.get_or_create", new_callable=AsyncMock
            ) as mock_node_create,
            patch("app.domain.memory.graph_service.logger.warning") as mock_logger,
        ):
            # Force an exception during node creation
            mock_node_create.side_effect = Exception("Database lock error")

            await GraphExtractionService.process_and_store_graph("text", user_id)

            # It should catch the exception and log it
            mock_logger.assert_called_once()
            call_args = mock_logger.call_args[0]
            assert "Failed to store graph elements" in call_args[0]
