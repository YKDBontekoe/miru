with open("frontend/lib/core/api/api_service.dart", "r") as f:
    content = f.read()

# Fix submitFeedback which was added outside of the ApiService class
if "Future<void> submitFeedback" in content:
    content = content.replace("Future<void> submitFeedback", "  Future<void> submitFeedback")

# move it inside the class
import re
match = re.search(r"(}\s*)(class ApiAuthException implements Exception {)", content)
if match:
    # It was placed at the end of the file, move it inside ApiService
    feedback_func = """
  Future<void> submitFeedback(String messageId, bool isPositive) async {
    try {
      final dio = _getDio();
      await dio.post(
        'messages/$messageId/feedback',
        data: {'is_positive': isPositive},
      );
    } on DioException catch (e) {
      final errorBody = e.response?.data?.toString() ?? e.message;
      throw Exception(
        'Failed to submit feedback (${e.response?.statusCode}): $errorBody',
      );
    }
  }
"""
    # remove the improperly placed one
    content = re.sub(r"  Future<void> submitFeedback.*?}\n", "", content, flags=re.DOTALL)

    # Place it inside ApiService
    content = content.replace(match.group(0), feedback_func + match.group(0))

with open("frontend/lib/core/api/api_service.dart", "w") as f:
    f.write(content)
