import re

with open("frontend/lib/api_service.dart", "r") as f:
    content = f.read()

# Fix ApiAuthException
content = content.replace("class ApiAuthException {", "class ApiAuthException implements Exception {")
content = content.replace("throw const ApiAuthException('Session expired. Please sign in again.');", "throw ApiAuthException('Session expired. Please sign in again.');")
content = content.replace("throw const ApiAuthException", "throw ApiAuthException")

with open("frontend/lib/api_service.dart", "w") as f:
    f.write(content)
