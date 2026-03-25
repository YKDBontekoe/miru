import re

with open('backend/tests/test_openrouter.py', 'r') as f:
    content = f.read()

# I see code coverage is low because accept_language branch is not tested.
# Let's add a test to test_openrouter.py

new_test = """
@pytest.mark.asyncio
async def test_standalone_chat_completion_with_language() -> None:
    with (
        patch("app.infrastructure.external.openrouter.get_openrouter_client") as mock_get_client,
        patch("app.infrastructure.external.openrouter.get_settings") as mock_settings,
    ):
        mock_settings.return_value = MagicMock(default_chat_model="default-model")
        mock_client = MagicMock()
        mock_client.chat_completion = AsyncMock(return_value="bonjour")
        mock_get_client.return_value = mock_client

        result = await chat_completion(
            [{"role": "user", "content": "hi"}], accept_language="fr-FR"
        )

        assert result == "bonjour"
        called_msgs = mock_client.chat_completion.call_args[0][0]
        assert len(called_msgs) == 2
        assert called_msgs[0]["role"] == "system"
        assert "fr-FR" in called_msgs[0]["content"]

@pytest.mark.asyncio
async def test_standalone_stream_chat_with_language() -> None:
    with (
        patch("app.infrastructure.external.openrouter.get_openrouter_client") as mock_get_client,
        patch("app.infrastructure.external.openrouter.get_settings") as mock_settings,
    ):
        mock_settings.return_value = MagicMock(default_chat_model="default-model")
        mock_client = MagicMock()

        async def mock_gen():
            yield "bonjour"

        mock_client.stream_chat = AsyncMock(return_value=mock_gen())
        mock_get_client.return_value = mock_client

        result_gen = await stream_chat(
            [{"role": "user", "content": "hi"}], accept_language="fr-FR"
        )
        items = [x async for x in result_gen]
        assert items == ["bonjour"]
        called_msgs = mock_client.stream_chat.call_args[0][0]
        assert len(called_msgs) == 2
        assert called_msgs[0]["role"] == "system"
        assert "fr-FR" in called_msgs[0]["content"]

@pytest.mark.asyncio
async def test_standalone_structured_completion_with_language() -> None:
    with (
        patch("app.infrastructure.external.openrouter.get_openrouter_client") as mock_get_client,
        patch("app.infrastructure.external.openrouter.get_settings") as mock_settings,
    ):
        mock_settings.return_value = MagicMock(default_chat_model="default-model")
        mock_client = MagicMock()
        mock_client.structured_completion = AsyncMock(return_value=DummyModel(name="bonjour"))
        mock_get_client.return_value = mock_client

        result = await structured_completion(
            [{"role": "user", "content": "hi"}], DummyModel, accept_language="fr-FR"
        )

        assert result.name == "bonjour"
        called_msgs = mock_client.structured_completion.call_args[0][0]
        assert len(called_msgs) == 2
        assert called_msgs[0]["role"] == "system"
        assert "fr-FR" in called_msgs[0]["content"]

"""

content = content + new_test

with open('backend/tests/test_openrouter.py', 'w') as f:
    f.write(content)
