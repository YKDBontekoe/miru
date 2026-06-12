with open('backend/app/domain/auth/interfaces.py', 'r') as f:
    content = f.read()

old_protocol = '''class TokenVerifierProtocol(Protocol):
    """Protocol for JWT verification."""

    async def verify(self, token: str) -> JWTPayload:
        """Verify and decode a JWT."""
        pass'''

new_protocol = '''class TokenVerifierProtocol(Protocol):
    """Protocol for JWT verification.

    Implementations of this protocol are responsible for decoding and verifying
    authentication tokens (e.g., extracting claims, verifying signatures, checking expiration).
    """

    async def verify(self, token: str) -> JWTPayload:
        """Verify and decode a JWT.

        Args:
            token (str): The raw JWT string, typically extracted from an Authorization header.

        Returns:
            JWTPayload: The decoded and validated JWT payload containing user claims.

        Raises:
            jwt.InvalidTokenError: If the token is structurally invalid or signature verification fails.
            jwt.ExpiredSignatureError: If the token's expiration time has passed.
            ValueError: If the token format is fundamentally incorrect.
        """
        pass'''

content = content.replace(old_protocol, new_protocol)

with open('backend/app/domain/auth/interfaces.py', 'w') as f:
    f.write(content)
