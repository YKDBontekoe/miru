We need to address the inline comments on `backend/app/api/v1/memory.py` and then reply to the main comment.

The comments ask for the following changes in `backend/app/api/v1/memory.py`:
1. Add `responses={503: {"description": "Upstream AI service is currently unreachable"}}` or similar to the route decorators for all 4 endpoints returning 503 JSONResponse.
2. Update the `JSONResponse` payloads for all 4 endpoints (status_code=503) to include an `"error": "upstream_unreachable"` field alongside `"detail"`.
3. In `upload_document`, for the `except Exception as e:` block, create a module-level logger (`logger = logging.getLogger(__name__)`), log the exception with `logger.exception("Failed to process document")`, and raise `HTTPException(status_code=500, detail="Failed to process document")` without the raw exception message `e` in the detail string. We can keep `from e`.
4. In all 4 endpoints, the `except (APIConnectionError, OSError) as e:` blocks need to inspect `e.errno` for `OSError`s. If it's a network-related `errno` (like `errno.ENETUNREACH`, `errno.EHOSTUNREACH`, `errno.ENETDOWN`, `errno.ECONNREFUSED`, `errno.ETIMEDOUT`), return the 503 JSONResponse. If it's another `errno`, re-raise the `OSError`. We also need to import `errno` and `logging`.

Let's modify `backend/app/api/v1/memory.py`.
