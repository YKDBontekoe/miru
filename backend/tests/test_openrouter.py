from unittest.mock import MagicMock, patch

from app.infrastructure.external.openrouter import get_openrouter_client


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


def test_openrouter_client_init() -> None:
    """Test that the OpenRouterClient initializes instructor with JSON mode."""
    with (
        patch("openai.AsyncOpenAI") as mock_openai,
        patch("instructor.from_openai") as mock_from_openai,
    ):
        from app.infrastructure.external.openrouter import OpenRouterClient
        import instructor

        mock_openai_instance = MagicMock()
        mock_openai.return_value = mock_openai_instance

        mock_instructor_instance = MagicMock()
        mock_from_openai.return_value = mock_instructor_instance

        client = OpenRouterClient("test-key")

        mock_openai.assert_called_once()
        assert mock_openai.call_args[1]["api_key"] == "test-key"

        # Verify instructor is initialized with JSON mode
        mock_from_openai.assert_called_once_with(
            mock_openai_instance,
            mode=instructor.Mode.JSON,
        )
        assert client.instructor_client == mock_instructor_instance
