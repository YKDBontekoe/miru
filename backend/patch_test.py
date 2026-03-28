with open("backend/tests/test_infrastructure.py", "r") as f:
    content = f.read()

# We need to find if there are tests leaving an un-awaited coroutine
