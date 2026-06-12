with open('backend/app/infrastructure/auth/jwt_verifier.py', 'r') as f:
    content = f.read()

old = '''logger = logging.getLogger(__name__)

from app.core.config import get_settings
from app.domain.auth.schemas import JWTPayload'''

new = '''from app.core.config import get_settings
from app.domain.auth.schemas import JWTPayload

logger = logging.getLogger(__name__)'''

content = content.replace(old, new)

with open('backend/app/infrastructure/auth/jwt_verifier.py', 'w') as f:
    f.write(content)
