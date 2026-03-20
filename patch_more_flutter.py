import re

with open("frontend/lib/features/rooms/pages/group_chat_page.dart", "r") as f:
    content = f.read()

# Add missing import for group_chat_page
if "import 'package:shared_preferences/shared_preferences.dart';" not in content:
    content = "import 'package:shared_preferences/shared_preferences.dart';\n" + content

# Check where onFeedback was placed, it might be on MessageList not ChatBubble
if "onFeedback: (msg, isPositive) => _handleFeedback(msg, isPositive)," in content:
    pass
else:
    content = content.replace("onRetry: _retryLastMessage,", "onRetry: _retryLastMessage,\nonFeedback: (msg, isPositive) => _handleFeedback(msg, isPositive),")

with open("frontend/lib/features/rooms/pages/group_chat_page.dart", "w") as f:
    f.write(content)


with open("frontend/lib/features/chat/pages/chat_page.dart", "r") as f:
    content = f.read()

# Restore missing import
if "import 'package:miru/features/chat/widgets/scroll_to_bottom_button.dart';" not in content:
    content = content.replace("import 'package:miru/features/chat/widgets/miru_app_bar.dart';", "import 'package:miru/features/chat/widgets/miru_app_bar.dart';\nimport 'package:miru/features/chat/widgets/scroll_to_bottom_button.dart';")

content = content.replace("import 'package:shared_preferences/shared_preferences.dart';\nimport 'package:shared_preferences/shared_preferences.dart';", "import 'package:shared_preferences/shared_preferences.dart';")

with open("frontend/lib/features/chat/pages/chat_page.dart", "w") as f:
    f.write(content)
