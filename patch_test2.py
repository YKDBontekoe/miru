with open("frontend/test/features/rooms/pages/group_chat_page_test.dart", "r") as f:
    content = f.read()

# fix SharedPreferences mock
content = content.replace("import 'package:shared_preferences/shared_preferences.dart';", "import 'package:shared_preferences/shared_preferences.dart';\nimport 'package:shared_preferences_platform_interface/shared_preferences_platform_interface.dart';")

with open("frontend/test/features/rooms/pages/group_chat_page_test.dart", "w") as f:
    f.write(content)
