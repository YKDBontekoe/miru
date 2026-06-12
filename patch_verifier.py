with open('backend/app/infrastructure/auth/jwt_verifier.py', 'r') as f:
    content = f.read()

# Add __future__ import
if "from __future__ import annotations" not in content:
    content = "from __future__ import annotations\n\n" + content

# Fix logging and exception handling
old_except = '''        except Exception as exc:
            import logging

            logger = logging.getLogger(__name__)
            logger.warning("JWT validation failed: %s", exc)
            raise'''

new_except = '''        except jwt.PyJWTError as exc:
            logger.warning("JWT validation failed: %s", exc)
            raise
        except Exception as exc:
            logger.exception("JWT validation failed", exc_info=exc)
            raise'''

content = content.replace(old_except, new_except)

# Fix algorithm check
old_alg_check = '''            if alg == "HS256":
                payload = jwt.decode(
                    token,
                    settings.supabase_jwt_secret,
                    algorithms=["HS256"],
                    audience="authenticated",
                )
            else:
                jwks_client = self._get_jwks_client()
                # Wrap blocking call in to_thread
                signing_key = await asyncio.to_thread(jwks_client.get_signing_key_from_jwt, token)
                payload = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["ES256", "RS256"],
                    audience="authenticated",
                )'''

new_alg_check = '''            if alg == "HS256":
                payload = jwt.decode(
                    token,
                    settings.supabase_jwt_secret,
                    algorithms=["HS256"],
                    audience="authenticated",
                )
            elif alg in ("ES256", "RS256"):
                jwks_client = self._get_jwks_client()
                # Wrap blocking call in to_thread
                signing_key = await asyncio.to_thread(jwks_client.get_signing_key_from_jwt, token)
                payload = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["ES256", "RS256"],
                    audience="authenticated",
                )
            else:
                raise jwt.InvalidAlgorithmError(f"Unsupported algorithm: {alg}")'''

content = content.replace(old_alg_check, new_alg_check)

# Add logger initialization
if "logger = logging.getLogger(__name__)" not in content:
    content = content.replace("import jwt\n", "import logging\nimport jwt\n\nlogger = logging.getLogger(__name__)\n")

with open('backend/app/infrastructure/auth/jwt_verifier.py', 'w') as f:
    f.write(content)
