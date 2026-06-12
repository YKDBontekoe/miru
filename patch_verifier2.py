with open('backend/app/infrastructure/auth/jwt_verifier.py', 'r') as f:
    content = f.read()

# Fix the import E402
old_top = '''from __future__ import annotations

import asyncio
import jwt
import logging

logger = logging.getLogger(__name__)

from app.core.config import get_settings
from app.domain.auth.schemas import JWTPayload'''

new_top = '''from __future__ import annotations

import asyncio
import logging

import jwt

from app.core.config import get_settings
from app.domain.auth.schemas import JWTPayload

logger = logging.getLogger(__name__)'''

content = content.replace(old_top, new_top)

with open('backend/app/infrastructure/auth/jwt_verifier.py', 'w') as f:
    f.write(content)
