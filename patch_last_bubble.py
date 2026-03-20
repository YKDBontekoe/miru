import re

with open("frontend/lib/core/design_system/components/chat_bubble.dart", "r") as f:
    content = f.read()

# fix the two unused parameter warnings
content = content.replace("    this.onFeedback,\n    this.feedback,\n    required this.screenWidth,\n  });", "    this.onFeedback,\n    this.feedback,\n    required this.screenWidth,\n  });")
content = content.replace("                  // Bubble\n                  GestureDetector(", "                  // Bubble\n                  GestureDetector(")

content = re.sub(r"                              text: text,\n                              colors: colors,\n                              isFailed: isFailed,\n                            \),", "                              text: text,\n                              colors: colors,\n                              isFailed: isFailed,\n                            ),", content)

content = content.replace("""                  if (!isStreaming && !isEmpty)
                    _ActionRow(
                      onCopy: onCopy,
                      onRetry: isFailed ? onRetry : null,
                      onFeedback: onFeedback,
                      feedback: feedback,
                      colors: colors,
                    ),""", """                  if (!isStreaming && !isEmpty)
                    _ActionRow(
                      onCopy: onCopy,
                      onRetry: isFailed ? onRetry : null,
                      onFeedback: onFeedback,
                      feedback: feedback,
                      colors: colors,
                    ),""")

with open("frontend/lib/core/design_system/components/chat_bubble.dart", "w") as f:
    f.write(content)

with open("frontend/lib/features/chat/pages/chat_page.dart", "r") as f:
    content = f.read()

content = content.replace("import 'package:shared_preferences/shared_preferences.dart';\nimport 'package:shared_preferences/shared_preferences.dart';", "import 'package:shared_preferences/shared_preferences.dart';")

# Another try for duplicate imports, it might not be adjacent lines
content = re.sub(r"(import 'package:shared_preferences/shared_preferences\.dart';[\s\S]*?)import 'package:shared_preferences/shared_preferences\.dart';", r"\1", content)

with open("frontend/lib/features/chat/pages/chat_page.dart", "w") as f:
    f.write(content)
