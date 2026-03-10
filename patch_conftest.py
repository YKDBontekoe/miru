with open("backend/tests/conftest.py", "r") as f:
    content = f.read()

content = content.replace("return jwt.encode(payload, _JWT_SECRET, algorithm=_JWT_ALGORITHM)", "return str(jwt.encode(payload, _JWT_SECRET, algorithm=_JWT_ALGORITHM))")

with open("backend/tests/conftest.py", "w") as f:
    f.write(content)
