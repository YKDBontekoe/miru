import re

def fix_api_service():
    with open("frontend/lib/api_service.dart", "r") as f:
        content = f.read()

    # Fix assignment issues
    content = content.replace("final List<dynamic> data = jsonDecode(response.body);", "final List<dynamic> data = jsonDecode(response.body) as List<dynamic>;")

    with open("frontend/lib/api_service.dart", "w") as f:
        f.write(content)

fix_api_service()

def fix_rooms_page():
    with open("frontend/lib/rooms_page.dart", "r") as f:
        content = f.read()

    content = content.replace("import 'models/agent.dart';", "")

    with open("frontend/lib/rooms_page.dart", "w") as f:
        f.write(content)

fix_rooms_page()
