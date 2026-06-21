with open("backend/tests/test_auth_integration.py", "r") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if line.startswith("        import datetime") and "import datetime" in line:
        new_lines.append("        import datetime\n")
    elif line.startswith(
        "        created1_rec = await PasskeyModel.get(id=created1.id)"
    ):
        new_lines.append(
            "        created1_rec = await PasskeyModel.get(id=created1.id)\n"
        )
    elif line.startswith(
        "        created1_rec.created_at = created1_rec.created_at - datetime.timedelta(days=1)"
    ):
        new_lines.append(
            "        created1_rec.created_at = created1_rec.created_at - datetime.timedelta(days=1)\n"
        )
    elif line.startswith(
        '        await created1_rec.save(update_fields=["created_at"])'
    ):
        new_lines.append(
            '        await created1_rec.save(update_fields=["created_at"])\n'
        )
    else:
        new_lines.append(line)

with open("backend/tests/test_auth_integration.py", "w") as f:
    f.writelines(new_lines)
