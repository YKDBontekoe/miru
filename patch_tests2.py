import re

with open('backend/tests/test_auth.py', 'r') as f:
    content = f.read()

old_happy = '''    # Create an asymmetric keypair
    private_key_pem = jwt.algorithms.RSAAlgorithm.generate_key(2048)
    public_key_pem = private_key_pem.public_key()

    # Create a token signed with the private key
    headers = {"kid": "mock_kid"}
    payload = {
        "sub": "123e4567-e89b-12d3-a456-426614174000",
        "role": "authenticated",
        "exp": 9999999999,
        "iat": 1516239022
    }
    token = jwt.encode(payload, private_key_pem, algorithm="RS256", headers=headers)'''

new_happy = '''    # Create an asymmetric keypair using cryptography
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.hazmat.primitives import serialization

    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_key = private_key.public_key()

    private_key_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption()
    )
    public_key_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )

    # Create a token signed with the private key
    headers = {"kid": "mock_kid"}
    payload = {
        "sub": "123e4567-e89b-12d3-a456-426614174000",
        "role": "authenticated",
        "exp": 9999999999,
        "iat": 1516239022
    }
    token = jwt.encode(payload, private_key_pem, algorithm="RS256", headers=headers)'''

content = content.replace(old_happy, new_happy)

with open('backend/tests/test_auth.py', 'w') as f:
    f.write(content)
