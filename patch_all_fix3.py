import re

with open("backend/app/domain/agent_tools/productivity/tasks_tools.py", "r") as f:
    code = f.read()

code = re.sub(
    r"        except TaskNotFoundError:\n        raise\n        except Exception:\n        logger\.exception\(\"Error in UpdateTaskTool\"\)\n        return \"Error updating task\.\"\n",
    "",
    code
)

with open("backend/app/domain/agent_tools/productivity/tasks_tools.py", "w") as f:
    f.write(code)
