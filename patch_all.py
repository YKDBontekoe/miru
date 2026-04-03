import re

# Utils file is already created

# --- events_tools.py ---
with open("backend/app/domain/agent_tools/productivity/events_tools.py", "r") as f:
    code = f.read()

code = code.replace(
    "from app.domain.productivity.use_cases.manage_productivity import (",
    "from app.domain.agent_tools.productivity.utils import handle_tool_error\nfrom app.domain.productivity.use_cases.manage_productivity import ("
)

code = re.sub(
    r"    async def _run\(self\) -> str:\n        try:\n",
    r'    @handle_tool_error("Error fetching calendar events.")\n    async def _run(self) -> str:\n',
    code
)
code = re.sub(
    r"            return result\n        except Exception:\n            logger\.exception\(\"Error in ListEventsTool\"\)\n            return \"Error fetching calendar events\.\"\n",
    r"            return result\n",
    code
)

code = re.sub(
    r"    async def _run\(\n        self,\n        title: str,\n        start_time: datetime,\n        end_time: datetime,\n        description: str \| None = None,\n        is_all_day: bool = False,\n        location: str \| None = None,\n        origin_context: str \| None = None,\n    \) -> str:\n        try:\n",
    r'    @handle_tool_error(\n        "Error creating calendar event.",\n        reraise=(CalendarEventNotFoundError, InvalidTimeRangeError),\n    )\n    async def _run(\n        self,\n        title: str,\n        start_time: datetime,\n        end_time: datetime,\n        description: str | None = None,\n        is_all_day: bool = False,\n        location: str | None = None,\n        origin_context: str | None = None,\n    ) -> str:\n',
    code
)
code = re.sub(
    r"            return f\"Successfully created calendar event '\{event\.title\}' with ID \{event\.id\}\.\"\n        except \(CalendarEventNotFoundError, InvalidTimeRangeError\):\n            raise\n        except Exception:\n            logger\.exception\(\"Error in CreateEventTool\"\)\n            return \"Error creating calendar event\.\"\n",
    r"            return f\"Successfully created calendar event '{event.title}' with ID {event.id}.\"\n",
    code
)

code = re.sub(
    r"    async def _run\(\n        self,\n        event_id: UUID,\n        title: str \| None = None,\n        description: str \| None = None,\n        start_time: datetime \| None = None,\n        end_time: datetime \| None = None,\n        is_all_day: bool \| None = None,\n        location: str \| None = None,\n    \) -> str:\n        try:\n",
    r'    @handle_tool_error(\n        "Error updating calendar event.",\n        reraise=(CalendarEventNotFoundError, InvalidTimeRangeError),\n    )\n    async def _run(\n        self,\n        event_id: UUID,\n        title: str | None = None,\n        description: str | None = None,\n        start_time: datetime | None = None,\n        end_time: datetime | None = None,\n        is_all_day: bool | None = None,\n        location: str | None = None,\n    ) -> str:\n',
    code
)
code = re.sub(
    r"            return f\"Successfully updated calendar event '\{event\.title\}' with ID \{event\.id\}\.\"\n        except \(CalendarEventNotFoundError, InvalidTimeRangeError\):\n            raise\n        except Exception:\n            logger\.exception\(\"Error in UpdateEventTool\"\)\n            return \"Error updating calendar event\.\"\n",
    r"            return f\"Successfully updated calendar event '{event.title}' with ID {event.id}.\"\n",
    code
)

code = re.sub(
    r"    async def _run\(self, event_id: UUID\) -> str:\n        try:\n",
    r'    @handle_tool_error(\n        "Error deleting calendar event.",\n        reraise=(CalendarEventNotFoundError, InvalidTimeRangeError),\n    )\n    async def _run(self, event_id: UUID) -> str:\n',
    code
)
code = re.sub(
    r"            return f\"Successfully deleted calendar event with ID \{event_id\}\.\"\n        except \(CalendarEventNotFoundError, InvalidTimeRangeError\):\n            raise\n        except Exception:\n            logger\.exception\(\"Error in DeleteEventTool\"\)\n            return \"Error deleting calendar event\.\"\n",
    r"            return f\"Successfully deleted calendar event with ID {event_id}.\"\n",
    code
)

def fix_indent(match):
    lines = match.group(0).split('\n')
    fixed = []
    for line in lines:
        if line.startswith("            "):
            fixed.append(line[4:])
        else:
            fixed.append(line)
    return '\n'.join(fixed)

code = re.sub(r"    async def _run\(self\) -> str:\n((?:            .*\n)+)", fix_indent, code)
code = re.sub(r"        origin_context: str \| None = None,\n    \) -> str:\n((?:            .*\n)+)", fix_indent, code)
code = re.sub(r"        location: str \| None = None,\n    \) -> str:\n((?:            .*\n)+)", fix_indent, code)
code = re.sub(r"    async def _run\(self, event_id: UUID\) -> str:\n((?:            .*\n)+)", fix_indent, code)

with open("backend/app/domain/agent_tools/productivity/events_tools.py", "w") as f:
    f.write(code)


# --- tasks_tools.py ---
with open("backend/app/domain/agent_tools/productivity/tasks_tools.py", "r") as f:
    code = f.read()

code = code.replace(
    "from app.domain.productivity.dependencies import get_productivity_use_case",
    "from app.domain.agent_tools.productivity.utils import handle_tool_error\nfrom app.domain.productivity.dependencies import get_productivity_use_case"
)

code = re.sub(
    r"    async def _run\(self\) -> str:\n        try:\n",
    r'    @handle_tool_error("Error fetching tasks.")\n    async def _run(self) -> str:\n',
    code
)
code = re.sub(
    r"            return result\n        except Exception:\n            logger\.exception\(\"Error in ListTasksTool\"\)\n            return \"Error fetching tasks\.\"\n",
    r"            return result\n",
    code
)

code = re.sub(
    r"    async def _run\(self, title: str, description: str \| None = None\) -> str:\n        try:\n",
    r'    @handle_tool_error("Error creating task.")\n    async def _run(self, title: str, description: str | None = None) -> str:\n',
    code
)
code = re.sub(
    r"            return f\"Successfully created task '\{task\.title\}' with ID \{task\.id\}\.\"\n        except Exception:\n            logger\.exception\(\"Error in CreateTaskTool\"\)\n            return \"Error creating task\.\"\n",
    r"            return f\"Successfully created task '{task.title}' with ID {task.id}.\"\n",
    code
)

code = re.sub(
    r"    async def _run\(\n        self, task_id: UUID, is_completed: bool \| None = None, title: str \| None = None\n    \) -> str:\n        try:\n",
    r'    @handle_tool_error("Error updating task.", reraise=(TaskNotFoundError,))\n    async def _run(\n        self, task_id: UUID, is_completed: bool | None = None, title: str | None = None\n    ) -> str:\n',
    code
)
code = re.sub(
    r"            return status_str\n        except TaskNotFoundError:\n            raise\n        except Exception:\n            logger\.exception\(\"Error in UpdateTaskTool\"\)\n            return \"Error updating task\.\"\n",
    r"            return status_str\n",
    code
)

code = re.sub(r"    async def _run\(self\) -> str:\n((?:            .*\n)+)", fix_indent, code)
code = re.sub(r"    async def _run\(self, title: str, description: str \| None = None\) -> str:\n((?:            .*\n)+)", fix_indent, code)
code = re.sub(r"    \) -> str:\n((?:            .*\n)+)", fix_indent, code)

# Fix missing return in UpdateTaskTool (my bad regex)
code = re.sub(
    r"            user_id=self\.user_id, task_id=task_id, update_data=update_data\n        \)\n\n        status = \"Completed\" if task\.is_completed else \"Pending\"\n",
    r"            user_id=self.user_id, task_id=task_id, update_data=update_data\n        )\n\n        status = \"Completed\" if task.is_completed else \"Pending\"\n        return f\"Successfully updated task '{task.title}' with ID {task.id}. Status is now: {status}.\"\n",
    code
)

with open("backend/app/domain/agent_tools/productivity/tasks_tools.py", "w") as f:
    f.write(code)


# --- notes_tools.py ---
with open("backend/app/domain/agent_tools/productivity/notes_tools.py", "r") as f:
    code = f.read()

code = code.replace(
    "from app.domain.productivity.dependencies import get_productivity_use_case",
    "from app.domain.agent_tools.productivity.utils import handle_tool_error\nfrom app.domain.productivity.dependencies import get_productivity_use_case"
)

code = re.sub(
    r"    async def _run\(self\) -> str:\n        try:\n",
    r'    @handle_tool_error("Error fetching notes.")\n    async def _run(self) -> str:\n',
    code
)
code = re.sub(
    r"            return result\n        except Exception:\n            logger\.exception\(\"Error in ListNotesTool\"\)\n            return \"Error fetching notes\.\"\n",
    r"            return result\n",
    code
)

code = re.sub(
    r"    async def _run\(self, title: str, content: str, origin_context: str \| None = None\) -> str:\n        try:\n",
    r'    @handle_tool_error("Error creating note.")\n    async def _run(self, title: str, content: str, origin_context: str | None = None) -> str:\n',
    code
)
code = re.sub(
    r"            return f\"Successfully created note '\{note\.title\}' with ID \{note\.id\}\.\"\n        except Exception:\n            logger\.exception\(\"Error in CreateNoteTool\"\)\n            return \"Error creating note\.\"\n",
    r"            return f\"Successfully created note '{note.title}' with ID {note.id}.\"\n",
    code
)

code = re.sub(r"    async def _run\(self\) -> str:\n((?:            .*\n)+)", fix_indent, code)
code = re.sub(r"    async def _run\(self, title: str, content: str, origin_context: str \| None = None\) -> str:\n((?:            .*\n)+)", fix_indent, code)


with open("backend/app/domain/agent_tools/productivity/notes_tools.py", "w") as f:
    f.write(code)
