import re

with open("frontend/lib/features/productivity/pages/action_page.dart", "r") as f:
    content = f.read()

# Make sure imports are clean and correct
# (We already saw it was good from 'No issues found!', just making sure AppShadows is right)

# Let's verify AppShadows fix actually worked
content = content.replace("[AppShadows.sm.first]", "AppShadows.sm")

with open("frontend/lib/features/productivity/pages/action_page.dart", "w") as f:
    f.write(content)
