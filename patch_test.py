with open("frontend/test/features/rooms/pages/group_chat_page_test.dart", "r") as f:
    content = f.read()

# Add shared_preferences mock import
content = content.replace("import 'package:miru/features/rooms/widgets/message_item.dart';", "import 'package:miru/features/rooms/widgets/message_item.dart';\nimport 'package:shared_preferences/shared_preferences.dart';")

setup_mock = """  setUp(() {
    SharedPreferences.setMockInitialValues({});
    mockApi = MockApiService();"""

content = content.replace("  setUp(() {\n    mockApi = MockApiService();", setup_mock)

with open("frontend/test/features/rooms/pages/group_chat_page_test.dart", "w") as f:
    f.write(content)
