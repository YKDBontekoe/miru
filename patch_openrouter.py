import re

with open('backend/tests/test_openrouter.py', 'r') as f:
    content = f.read()

# Add test for embed cancellation and embed exception to cover 91 and standard failure
new_test = """
@pytest.mark.asyncio
async def test_embed_cancellation() -> None:
    client = OpenRouterClient("test")
    client.openai_client.embeddings.create = AsyncMock(side_effect=asyncio.CancelledError())
    with pytest.raises(asyncio.CancelledError):
        await client.embed("text", "model")

@pytest.mark.asyncio
async def test_embed_exception() -> None:
    client = OpenRouterClient("test")
    client.openai_client.embeddings.create = AsyncMock(side_effect=Exception("Failed to embed"))
    with pytest.raises(Exception, match="Failed to embed"):
        await client.embed("text", "model")
"""

content = content + new_test

with open('backend/tests/test_openrouter.py', 'w') as f:
    f.write(content)
