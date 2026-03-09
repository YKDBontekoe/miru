from unittest.mock import MagicMock, patch

from app.openrouter import _get_client_and_model


def test_get_client_and_model():
    with (
        patch("app.openrouter.get_client") as mock_get_client,
        patch("app.openrouter.get_settings") as mock_settings,
    ):
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        mock_settings.return_value = MagicMock(default_chat_model="default-model")

        # Test with no model provided
        client, model = _get_client_and_model()
        assert client == mock_client
        assert model == "default-model"

        # Test with a specific model provided
        client, model = _get_client_and_model("custom-model")
        assert client == mock_client
        assert model == "custom-model"
