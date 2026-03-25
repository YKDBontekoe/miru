import re

with open('backend/tests/test_openrouter.py', 'r') as f:
    content = f.read()

# Add test for structured_completion failing (the cancellation and fallback paths)
new_test = """
@pytest.mark.asyncio
async def test_standalone_structured_completion_cancellation() -> None:
    with (
        patch("app.infrastructure.external.openrouter.get_openrouter_client") as mock_get_client,
        patch("app.infrastructure.external.openrouter.get_settings") as mock_settings,
    ):
        mock_settings.return_value = MagicMock(default_chat_model="default-model")
        mock_client = MagicMock()
        mock_client.structured_completion = AsyncMock(side_effect=asyncio.CancelledError())
        mock_get_client.return_value = mock_client

        with pytest.raises(asyncio.CancelledError):
            await structured_completion([{"role": "user", "content": "hi"}], DummyModel)

@pytest.mark.asyncio
async def test_standalone_structured_completion_fallback_language() -> None:
    with (
        patch("app.infrastructure.external.openrouter.get_openrouter_client") as mock_get_client,
        patch("app.infrastructure.external.openrouter.get_settings") as mock_settings,
    ):
        mock_settings.return_value = MagicMock(default_chat_model="default-model", fallback_chat_model="fallback-model")
        mock_client = MagicMock()

        mock_client.structured_completion = AsyncMock(side_effect=[Exception("Error"), DummyModel(name="bonjour")])
        mock_get_client.return_value = mock_client

        result = await structured_completion([{"role": "user", "content": "hi"}], DummyModel, accept_language="fr-FR")
        assert result.name == "bonjour"

@pytest.mark.asyncio
async def test_standalone_structured_completion_fallback_fails_language() -> None:
    with (
        patch("app.infrastructure.external.openrouter.get_openrouter_client") as mock_get_client,
        patch("app.infrastructure.external.openrouter.get_settings") as mock_settings,
    ):
        mock_settings.return_value = MagicMock(default_chat_model="default-model", fallback_chat_model="fallback-model")
        mock_client = MagicMock()
        mock_client.structured_completion = AsyncMock(side_effect=[Exception("Error"), Exception("FallbackError")])
        mock_get_client.return_value = mock_client

        with pytest.raises(Exception, match="FallbackError"):
            await structured_completion([{"role": "user", "content": "hi"}], DummyModel)
"""

content = content + new_test

with open('backend/tests/test_openrouter.py', 'w') as f:
    f.write(content)
