"""CrewAI tools for Discord Web API."""

from __future__ import annotations

import asyncio
import json
import logging

import nest_asyncio
from crewai.tools import BaseTool
from pydantic import Field

from app.core.utils.error_handlers import handle_tool_error
from app.infrastructure.external.discord import get_server_info, send_message

logger = logging.getLogger(__name__)


class DiscordGetServerInfoTool(BaseTool):
    """Tool to fetch Discord server info."""

    name: str = "discord_get_server_info"
    description: str = (
        "Fetch basic information about a Discord server (guild), "
        "such as name, description, and member count. "
        "Requires a Discord bot token and a guild ID."
    )

    bot_token: str = Field(..., description="The Discord Bot token.")
    guild_id: str = Field(default="", description="The ID of the Discord server (guild).")

    @handle_tool_error()
    def _run(self) -> str:
        """Run the tool synchronously."""
        try:
            asyncio.get_running_loop()
            nest_asyncio.apply()
        except RuntimeError:
            # No running event loop expected when called synchronously
            pass
        return asyncio.run(self._arun())

    @handle_tool_error()
    async def _arun(self) -> str:
        """Async implementation of the tool."""
        if not self.guild_id:
            return "Error: guild_id is required."
        info = await get_server_info(self.bot_token, self.guild_id)
        if not info:
            return f"Could not fetch info for guild ID: {self.guild_id}."

        return json.dumps(info, indent=2)


class DiscordSendMessageTool(BaseTool):
    """Tool to send a message to a Discord channel."""

    name: str = "discord_send_message"
    description: str = (
        "Send a text message to a specific Discord channel. "
        "Requires a Discord bot token, a channel ID, and the message content."
    )

    bot_token: str = Field(..., description="The Discord Bot token.")
    channel_id: str = Field(default="", description="The ID of the Discord channel.")
    content: str = Field(default="", description="The text content of the message.")

    @handle_tool_error()
    def _run(self) -> str:
        """Run the tool synchronously."""
        try:
            asyncio.get_running_loop()
            nest_asyncio.apply()
        except RuntimeError:
            # No running event loop expected when called synchronously
            pass
        return asyncio.run(self._arun())

    @handle_tool_error()
    async def _arun(self) -> str:
        """Async implementation of the tool.

        Returns:
            str: JSON formatted response or error message.
        """
        if not self.channel_id or not self.content:
            return "Error: channel_id and content are required."
        success = await send_message(self.bot_token, self.channel_id, self.content)
        if not success:
            return f"Failed to send message to channel ID: {self.channel_id}."

        return f"Message sent successfully to channel ID: {self.channel_id}."
