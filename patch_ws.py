import re

with open('backend/app/api/v1/websocket.py', 'r') as f:
    content = f.read()

# Replace _verify_token implementation
old_verify = '''async def _verify_token(token: str) -> UUID | None:
    """Decode a Supabase JWT by delegating to AuthService.decode_jwt."""
    try:
        verifier = get_jwt_verifier()
        auth_service = AuthService(AuthRepository(get_supabase()), verifier)
        payload = await auth_service.decode_jwt(token)
        return payload.sub
    except Exception:
        logger.warning("WS auth rejected: invalid token")
        return None'''

new_verify = '''async def _verify_token(token: str) -> UUID | None:
    """Decode a Supabase JWT using the configured token verifier."""
    try:
        verifier = get_jwt_verifier()
        payload = await verifier.verify(token)
        return payload.sub
    except Exception:
        logger.warning("WS auth rejected: invalid token")
        return None'''

content = content.replace(old_verify, new_verify)

# Remove the unused imports
content = content.replace('from app.domain.auth.service import AuthService\n', '')
content = content.replace('from app.infrastructure.repositories.auth_repo import AuthRepository\n', '')
content = content.replace('from app.infrastructure.database.supabase import get_supabase\n', '')


with open('backend/app/api/v1/websocket.py', 'w') as f:
    f.write(content)
