import re

with open("frontend/lib/features/productivity/pages/action_page.dart", "r") as f:
    content = f.read()

# Add ProductivityService import if missing
if "import 'package:miru/core/api/productivity_service.dart';" not in content:
    content = "import 'package:miru/core/api/productivity_service.dart';\n" + content

# Fix the function declaration
old_func_decl = """    final onRefresh = () => ref.read(calendarEventsProvider.notifier).refresh();"""
new_func_decl = """    void onRefresh() => ref.read(calendarEventsProvider.notifier).refresh();"""
content = content.replace(old_func_decl, new_func_decl)


with open("frontend/lib/features/productivity/pages/action_page.dart", "w") as f:
    f.write(content)
