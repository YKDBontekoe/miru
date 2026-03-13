from unittest.mock import MagicMock, patch

from app.infrastructure.external.openrouter import OpenRouterClient, get_openrouter_client


def test_openrouter_client_initializes_with_json_mode() -> None:
    with (
        patch("instructor.from_openai") as mock_from_openai,
        patch("openai.AsyncOpenAI") as mock_async_openai,
    ):
        mock_openai_instance = MagicMock()
        mock_async_openai.return_value = mock_openai_instance

        client = OpenRouterClient(api_key="fake-key")

        import instructor
        mock_from_openai.assert_called_once_with(mock_openai_instance, mode=instructor.Mode.JSON)


def test_get_openrouter_client() -> None:
    with (
        patch("app.infrastructure.external.openrouter.get_settings") as mock_settings,
        patch("app.infrastructure.external.openrouter.OpenRouterClient") as mock_client_class,
    ):
        mock_settings.return_value = MagicMock(openrouter_api_key="test-key")
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client

        # Test getting the client
        client = get_openrouter_client()
        assert client == mock_client
        mock_client_class.assert_called_once_with("test-key")
