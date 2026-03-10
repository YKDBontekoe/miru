import re

def fix_lints():
    with open("frontend/lib/group_chat_page.dart", "r") as f:
        content = f.read()

    # The async gap in the _loadData() finally block where we check `if(mounted) setState(...)`. The previous awaits create an async gap.
    content = content.replace("} finally {\n      if (mounted) {\n        setState(() => _isLoading = false);\n      }\n    }", "} finally {\n      if (mounted) {\n        setState(() => _isLoading = false);\n      }\n    }") # Oh, if(mounted) is fine for State methods, but wait, the lint says:
    # `lib/group_chat_page.dart:46:11 • use_build_context_synchronously`
    # Let's check line 46.

    with open("frontend/lib/group_chat_page.dart", "w") as f:
        f.write(content)

fix_lints()
