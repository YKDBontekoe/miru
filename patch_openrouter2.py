import re

with open('backend/tests/test_openrouter.py', 'r') as f:
    content = f.read()

# Add test for chat_completion fallback fail
new_test = """
@pytest.mark.asyncio
async def test_standalone_chat_completion_fallback_fail() -> None:
    with (
        patch("app.infrastructure.external.openrouter.get_openrouter_client") as mock_get_client,
        patch("app.infrastructure.external.openrouter.get_settings") as mock_settings,
    ):
        mock_settings.return_value = MagicMock(default_chat_model="default-model", fallback_chat_model="fallback-model")
        mock_client = MagicMock()
        mock_client.chat_completion = AsyncMock(side_effect=[Exception("Error"), Exception("FallbackError")])
        mock_get_client.return_value = mock_client

        with pytest.raises(Exception, match="FallbackError"):
            await chat_completion([{"role": "user", "content": "hi"}])
"""

content = content + new_test

with open('backend/tests/test_openrouter.py', 'w') as f:
    f.write(content)
