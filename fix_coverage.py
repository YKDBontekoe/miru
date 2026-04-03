import re

file = 'backend/tests/test_infrastructure.py'
with open(file, 'r') as f:
    content = f.read()

test = """
@pytest.mark.asyncio
async def test_chat_completion_with_language() -> None:
    mock_client = AsyncMock()
    mock_client.chat_completion = AsyncMock(return_value="World!")
    with patch("app.infrastructure.external.openrouter._client", mock_client):
        from app.infrastructure.external.openrouter import chat_completion

        result = await chat_completion([{"role": "user", "content": "Hi"}], model="custom/model", accept_language="es")
    assert result == "World!"
    mock_client.chat_completion.assert_awaited_once_with(
        [{"role": "user", "content": "Hi"}], "custom/model", accept_language="es"
    )

@pytest.mark.asyncio
async def test_stream_chat_with_language() -> None:
    from app.infrastructure.external.openrouter import OpenRouterClient

    client = OpenRouterClient.__new__(OpenRouterClient)
    client.openai_client = MagicMock()
    client.openai_client.chat = MagicMock()
    client.openai_client.chat.completions = MagicMock()
    client.openai_client.chat.completions.create = AsyncMock(return_value=["test"])

    result = await client.stream_chat([{"role": "user", "content": "Hi"}], "model", accept_language="es")
    assert result == ["test"]
    client.openai_client.chat.completions.create.assert_awaited_once_with(
        model="model",
        messages=[{'role': 'system', 'content': 'Please respond in the locale corresponding to the Accept-Language header: es.'}, {'role': 'user', 'content': 'Hi'}],
        stream=True
    )

@pytest.mark.asyncio
async def test_structured_completion_with_language() -> None:
    from app.infrastructure.external.openrouter import ChatResponse, OpenRouterClient

    client = OpenRouterClient.__new__(OpenRouterClient)
    client.instructor_client = MagicMock()
    client.instructor_client.chat = MagicMock()
    client.instructor_client.chat.completions = MagicMock()
    client.instructor_client.chat.completions.create = AsyncMock(return_value=ChatResponse(message="test"))

    result = await client.structured_completion([{"role": "user", "content": "Hi"}], "model", ChatResponse, accept_language="fr")
    assert result.message == "test"
    client.instructor_client.chat.completions.create.assert_awaited_once_with(
        model="model",
        messages=[{'role': 'system', 'content': 'Please respond in the locale corresponding to the Accept-Language header: fr.'}, {'role': 'user', 'content': 'Hi'}],
        response_model=ChatResponse
    )
"""

if "test_chat_completion_with_language" not in content:
    content += test

with open(file, 'w') as f:
    f.write(content)
