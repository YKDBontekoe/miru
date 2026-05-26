1. **Fix `HISTORY_PREFIX` in `backend/app/domain/chat/prompts.py`**
   - The comment states that `HISTORY_PREFIX` exceeds 100 characters. It should be broken into a multi-line implicit concatenated string.

2. **Add Docstrings in `backend/app/infrastructure/external/openrouter.py`**
   - `OpenRouterClient.embed`: Add a Google-style docstring explaining `text`, `model`, single vs batch behavior, returns, and raises.
   - `embed` module-level function: Add a similar Google-style docstring explaining `text`, overload behavior, and returns.

3. **Verify**
   - Run formatting (`uv run ruff format .`) and checks (`uv run ruff check .`) to verify that the line limits are respected.
   - Reply to the comments confirming the implementation.
   - Commit and submit on the *exact same branch* (`fix/llm-prompt-isolation-and-efficiency`).
