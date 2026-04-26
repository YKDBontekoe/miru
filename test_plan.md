1. **Frontend Hardening: Disable Cleartext Traffic**
   - Modify `frontend/app.json` to disable HTTP traffic by setting `"usesCleartextTraffic": false` in `android` and `NSAppTransportSecurity: { NSAllowsArbitraryLoads: false }` in `ios.infoPlist`.

2. **Backend Hardening: CORS Restrictions**
   - Modify `backend/app/core/config.py` to add `cors_allow_credentials` to the `Settings` class. Include a Pydantic `@model_validator` to enforce `cors_allow_credentials = False` if `cors_allowed_origins` contains a wildcard `*`.
   - Update `backend/app/main.py` to use `settings.cors_allow_credentials` when configuring `CORSMiddleware`. Strip whitespace from origin entries in `allow_origins`.

3. **Backend Hardening: Exception Masking**
   - In `backend/app/main.py`, add a global `@app.exception_handler(Exception)` that logs the full internal traceback but returns a generic `500 Internal Server Error` (e.g., `{"detail": "Internal server error"}`) to prevent leaking sensitive system details.

4. **Complete pre-commit steps**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

5. **Commit Changes**
   - Generate a security advisory, refactored code output, and integrity note.
