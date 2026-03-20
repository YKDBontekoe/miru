with open("frontend/test/features/rooms/pages/group_chat_page_test.dart", "r") as f:
    content = f.read()

# I apparently didn't place the imports correctly since it didn't find SharedPreferences
content = content.replace("import 'package:miru/core/api/api_service.dart';", "import 'package:miru/core/api/api_service.dart';\nimport 'package:shared_preferences/shared_preferences.dart';")

with open("frontend/test/features/rooms/pages/group_chat_page_test.dart", "w") as f:
    f.write(content)
