with open('backend/app/api/dependencies.py', 'r') as f:
    content = f.read()

old_get_jwt = '''def get_jwt_verifier() -> SupabaseJWTVerifier:
    return _jwt_verifier'''

new_get_jwt = '''def get_jwt_verifier() -> SupabaseJWTVerifier:
    """Provide the singleton SupabaseJWTVerifier instance.

    Returns:
        SupabaseJWTVerifier: A singleton token verifier that manages the PyJWKClient.
    """
    return _jwt_verifier'''

content = content.replace(old_get_jwt, new_get_jwt)

old_get_auth = '''def get_auth_service(
    repo: Annotated[AuthRepository, Depends(get_auth_repo)],
    verifier: Annotated[SupabaseJWTVerifier, Depends(get_jwt_verifier)],
) -> AuthService:
    return AuthService(repo, verifier)'''

new_get_auth = '''def get_auth_service(
    repo: Annotated[AuthRepository, Depends(get_auth_repo)],
    verifier: Annotated[SupabaseJWTVerifier, Depends(get_jwt_verifier)],
) -> AuthService:
    """Provide an instance of AuthService.

    Args:
        repo (AuthRepository): Injected repository for database access.
        verifier (SupabaseJWTVerifier): Injected verifier for validating tokens.

    Returns:
        AuthService: An instantiated AuthService ready to process auth requests.
    """
    return AuthService(repo, verifier)'''

content = content.replace(old_get_auth, new_get_auth)

with open('backend/app/api/dependencies.py', 'w') as f:
    f.write(content)
