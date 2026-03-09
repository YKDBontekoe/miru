import re

def patch_page(filename, class_name):
    with open(filename, "r") as f:
        content = f.read()

    # Dynamic map cast fix
    content = re.sub(r"\.map\(\(e\) => [A-Za-z]+\.fromJson\(e\)\)\.toList\(\)", lambda m: m.group(0).replace("(e)", "(e as Map<String, dynamic>)"), content)

    with open(filename, "w") as f:
        f.write(content)

patch_page("frontend/lib/agents_page.dart", "Agent")
patch_page("frontend/lib/rooms_page.dart", "ChatRoom")
patch_page("frontend/lib/group_chat_page.dart", "")

with open("frontend/lib/api_service.dart", "r") as f:
    content = f.read()

content = content.replace("class ApiAuthException", "class ApiAuthException implements Exception {\n  final String message;\n  const ApiAuthException(this.message);\n\n  @override\n  String toString() => 'ApiAuthException: $message';\n}")
content = content.replace("import 'package:supabase_flutter/supabase_flutter.dart';", "")

with open("frontend/lib/api_service.dart", "w") as f:
    f.write(content)

with open("frontend/lib/design_system/components/chat_bubble.dart", "r") as f:
    content = f.read()

content = content.replace("import '../../models/chat_message.dart';", "")

with open("frontend/lib/design_system/components/chat_bubble.dart", "w") as f:
    f.write(content)
