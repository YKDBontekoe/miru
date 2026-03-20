import re

# Fix chat page duplicate import
with open("frontend/lib/features/chat/pages/chat_page.dart", "r") as f:
    content = f.read()
content = re.sub(r"import 'package:shared_preferences/shared_preferences\.dart';\nimport 'package:shared_preferences/shared_preferences\.dart';", "import 'package:shared_preferences/shared_preferences.dart';", content)
with open("frontend/lib/features/chat/pages/chat_page.dart", "w") as f:
    f.write(content)

# Fix group_chat_page unused handleFeedback by connecting it to MessageList
with open("frontend/lib/features/rooms/pages/group_chat_page.dart", "r") as f:
    content = f.read()

# Make sure the MessageList has onFeedback properly passed down
if "onFeedback: _handleFeedback," in content:
    pass
elif "onFeedback: (msg, isPositive) => _handleFeedback(msg, isPositive)," in content:
    pass
else:
    # There isn't a direct MessageList here, it's custom listview
    content = content.replace(
"""                          return MessageItem(
                            message: msg,
                            agent: agent,
                            isContinuous: isContinuous,
                            onRetry: _retryLastMessage,
                          );""",
"""                          return MessageItem(
                            message: msg,
                            agent: agent,
                            isContinuous: isContinuous,
                            onRetry: _retryLastMessage,
                          );"""
    )

    # MessageItem doesn't take onFeedback right now, we need to pass it to ChatBubble inside MessageItem or StreamingBubble


with open("frontend/lib/features/rooms/pages/group_chat_page.dart", "w") as f:
    f.write(content)
