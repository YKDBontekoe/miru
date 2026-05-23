with open("backend/tests/test_memory_service.py", "r") as f:
    lines = f.readlines()

out = []
for line in lines:
    if '"""user_id = uuid4()' in line:
        out.append('    """\n')
        out.append("    user_id = uuid4()\n")
    elif '"""res = await memory_service' in line:
        out.append('    """\n')
        out.append(
            "    res = await memory_service"
            + line.split('"""res = await memory_service')[1]
        )
    elif '"""u_id = uuid4()' in line:
        out.append('    """\n')
        out.append("    u_id = uuid4()\n")
    else:
        out.append(line)

with open("backend/tests/test_memory_service.py", "w") as f:
    f.writelines(out)
