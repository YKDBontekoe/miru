import re

with open('backend/tests/test_openrouter.py', 'r') as f:
    content = f.read()

# Add test for stream_chat fallback and stream_chat fallback fail
new_test = """
@pytest.mark.asyncio
async def test_standalone_stream_chat_fallback() -> None:
    with (
        patch("app.infrastructure.external.openrouter.get_openrouter_client") as mock_get_client,
        patch("app.infrastructure.external.openrouter.get_settings") as mock_settings,
    ):
        mock_settings.return_value = MagicMock(default_chat_model="default-model", fallback_chat_model="fallback-model")
        mock_client = MagicMock()

        async def mock_gen():
            yield "bonjour"

        mock_client.stream_chat = AsyncMock(side_effect=[Exception("Error"), mock_gen()])
        mock_get_client.return_value = mock_client

        result_gen = await stream_chat([{"role": "user", "content": "hi"}])
        items = [x async for x in result_gen]
        assert items == ["bonjour"]

@pytest.mark.asyncio
async def test_standalone_stream_chat_fallback_fails() -> None:
    with (
        patch("app.infrastructure.external.openrouter.get_openrouter_client") as mock_get_client,
        patch("app.infrastructure.external.openrouter.get_settings") as mock_settings,
    ):
        mock_settings.return_value = MagicMock(default_chat_model="default-model", fallback_chat_model="fallback-model")
        mock_client = MagicMock()
        mock_client.stream_chat = AsyncMock(side_effect=[Exception("Error"), Exception("FallbackError")])
        mock_get_client.return_value = mock_client

        with pytest.raises(Exception, match="FallbackError"):
            result_gen = await stream_chat([{"role": "user", "content": "hi"}])
            async for _ in result_gen:
                pass
"""

content = content + new_test

with open('backend/tests/test_openrouter.py', 'w') as f:
    f.write(content)
