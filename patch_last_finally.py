with open("frontend/lib/features/rooms/pages/group_chat_page.dart", "r") as f:
    content = f.read()

content = content.replace(
"""        return MessageItem(
          key: ValueKey(msg.id),
          message: msg,
          senderName: _getSenderName(msg),
        );""",
"""        return MessageItem(
          key: ValueKey(msg.id),
          message: msg,
          senderName: _getSenderName(msg),
          onFeedback: _handleFeedback,
        );"""
)

with open("frontend/lib/features/rooms/pages/group_chat_page.dart", "w") as f:
    f.write(content)


import re
with open("frontend/lib/features/chat/pages/chat_page.dart", "r") as f:
    content = f.read()

content = re.sub(r"import 'package:shared_preferences/shared_preferences\.dart';\nimport 'package:shared_preferences/shared_preferences\.dart';", "import 'package:shared_preferences/shared_preferences.dart';", content)

with open("frontend/lib/features/chat/pages/chat_page.dart", "w") as f:
    f.write(content)
