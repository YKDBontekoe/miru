import re

# Fix api_service.dart
with open("frontend/lib/api_service.dart", "r") as f:
    content = f.read()

# Add missing class declaration and remove extra closing brace
content = content.replace("  // --- Agents API ---", "class ApiService {\n  static String get baseUrl => BackendService.baseUrl.value;\n  static Map<String, String> get _headers {\n    final token = SupabaseService.accessToken;\n    return {\n      'Content-Type': 'application/json; charset=utf-8',\n      if (token != null) 'Authorization': 'Bearer $token',\n    };\n  }\n\n  // --- Agents API ---")
content = content.replace("class ApiAuthException", "}\n\nclass ApiAuthException")
content = content.replace("class ApiAuthException implements Exception {", "class ApiAuthException implements Exception {\n  final String message;\n  const ApiAuthException(this.message);\n\n  @override\n  String toString() => 'ApiAuthException: $message';\n}")
content = content.replace("throw const ApiAuthException", "throw ApiAuthException")

with open("frontend/lib/api_service.dart", "w") as f:
    f.write(content)
