1. **Fix ruff linting errors**
   - Remove unused `agent_names` variables in `tests/chat/test_chat_ws.py` and `tests/test_chat_background_service.py`.
   - Remove unused `AgentMessage` import in `tests/test_chat_background_service.py`.
2. **Verify changes**
   - Run `cd backend && uv run ruff check .`
3. **Pre-commit step**
   - Complete pre commit steps to ensure proper testing, verification, review, and reflection are done.
