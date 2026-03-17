with open("frontend/lib/features/productivity/pages/action_page.dart", "r") as f:
    content = f.read()

content = content.replace("const SizedBox(height: 4)", "const SizedBox(height: AppSpacing.xxs)")
content = content.replace("const SizedBox(height: 8)", "const SizedBox(height: AppSpacing.xs)")
content = content.replace("const SizedBox(width: 4)", "const SizedBox(width: AppSpacing.xxs)")
content = content.replace("const SizedBox(height: 120)", "const SizedBox(height: AppSpacing.xxl * 3)")

with open("frontend/lib/features/productivity/pages/action_page.dart", "w") as f:
    f.write(content)
