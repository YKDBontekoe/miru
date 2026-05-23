
with open("backend/tests/test_memory_service.py", "r") as f:
    content = f.read()

# Make sure service and repo are accessible
# by fixing the uses of repo and service to use memory_service and memory_service.repo
content = content.replace("repo.", "memory_service.repo.")
content = content.replace("service.", "memory_service.")
content = content.replace("await repo.", "await memory_service.repo.")
content = content.replace("await service.", "await memory_service.")
content = content.replace("patch.object(service", "patch.object(memory_service")
content = content.replace("patch.object(repo", "patch.object(memory_service.repo")

# Make sure we don't accidentally do memory_service.memory_service
content = content.replace("memory_service.memory_service", "memory_service")
content = content.replace(
    "memory_service.repo.memory_service.repo", "memory_service.repo"
)

with open("backend/tests/test_memory_service.py", "w") as f:
    f.write(content)
