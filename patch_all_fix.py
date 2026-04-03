import re

# Fix stray backslashes introduced by f-string regex replacements

def fix_file(path):
    with open(path, "r") as f:
        code = f.read()

    code = code.replace(r'with ID {event.id}.\"', 'with ID {event.id}."')
    code = code.replace(r'with ID {event_id}.\"', 'with ID {event_id}."')
    code = code.replace(r'with ID {task.id}.\"', 'with ID {task.id}."')
    code = code.replace(r'with ID {note.id}.\"', 'with ID {note.id}."')

    code = code.replace(r'return f\"Successfully created', 'return f"Successfully created')
    code = code.replace(r'return f\"Successfully updated', 'return f"Successfully updated')
    code = code.replace(r'return f\"Successfully deleted', 'return f"Successfully deleted')

    with open(path, "w") as f:
        f.write(code)

fix_file("backend/app/domain/agent_tools/productivity/events_tools.py")
fix_file("backend/app/domain/agent_tools/productivity/tasks_tools.py")
fix_file("backend/app/domain/agent_tools/productivity/notes_tools.py")
