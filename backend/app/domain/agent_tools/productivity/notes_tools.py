from __future__ import annotations

import logging
from uuid import UUID

from app.domain.productivity.dependencies import get_productivity_use_case
from app.domain.productivity.schemas import NoteCreate
from crewai.tools import BaseTool
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class ListNotesInput(BaseModel):
    pass


class ListNotesTool(BaseTool):
    """Tool to list all notes for a specific user.

    Attributes:
        name: The name of the tool.
        description: A brief description of what the tool does.
        args_schema: The schema for the tool's input arguments.
        user_id: The unique identifier of the user whose notes are being listed.
        agent_id: The unique identifier of the agent listing the notes.
    """

    name: str = "List Notes Tool"
    description: str = "Lists all notes for the user. Useful to check what the user has noted."
    args_schema: type[BaseModel] = ListNotesInput
    user_id: UUID
    agent_id: UUID | None = None

    async def _run(self) -> str:
        try:
            notes = await get_productivity_use_case().list_notes(user_id=self.user_id)

            if not notes:
                return "No notes found."

            result = "Notes:\n"
            for n in notes:
                pinned = "(Pinned)" if n.is_pinned else ""
                result += f"- [{n.id}] {pinned} {n.title}\n"
                result += f"  Content: {n.content}\n"
            return result
        except Exception:
            logger.exception("Error in ListNotesTool")
            return "Error fetching notes."


class CreateNoteInput(BaseModel):
    title: str = Field(..., description="The title of the note.")
    content: str = Field(..., description="The content of the note.")
    origin_context: str | None = Field(
        None, description="A short description of why this note is being created."
    )


class CreateNoteTool(BaseTool):
    """Tool to create a new note for a specific user.

    Attributes:
        name: The name of the tool.
        description: A brief description of what the tool does.
        args_schema: The schema for the tool's input arguments.
        user_id: The unique identifier of the user for whom the note is being created.
        agent_id: The unique identifier of the agent creating the note.
        origin_message_id: The unique identifier of the message that triggered the note creation.
    """

    name: str = "Create Note Tool"
    description: str = "Creates a new note for the user."
    args_schema: type[BaseModel] = CreateNoteInput
    user_id: UUID
    agent_id: UUID | None = None
    origin_message_id: UUID | None = None

    async def _run(self, title: str, content: str, origin_context: str | None = None) -> str:
        try:
            note_data = NoteCreate(
                title=title,
                content=content,
                is_pinned=False,
                agent_id=self.agent_id,
                origin_message_id=self.origin_message_id,
                origin_context=origin_context,
            )
            note = await get_productivity_use_case().create_note(
                user_id=self.user_id, note_data=note_data
            )

            return f"Successfully created note '{note.title}' with ID {note.id}."
        except Exception:
            logger.exception("Error in CreateNoteTool")
            return "Error creating note."
