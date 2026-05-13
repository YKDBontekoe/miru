import re

with open("frontend/src/components/productivity/TodayPlanBanner.tsx", "r") as f:
    content = f.read()

# Fix translations and accessibility
content = content.replace("import { useTheme } from '@/hooks/useTheme';", "import { useTheme } from '@/hooks/useTheme';\nimport { useTranslation } from 'react-i18next';")
content = content.replace("  const { C } = useTheme();", "  const { C } = useTheme();\n  const { t } = useTranslation();")
content = content.replace(">Today plan</AppText>", ">{t('todayPlan', 'Today plan')}</AppText>")
content = content.replace("<Pressable onPress={onDismiss}>", "<Pressable onPress={onDismiss} accessibilityRole='button' accessibilityLabel='Close today plan banner'>")

# Fix native wind
content = content.replace("import { Pressable, StyleSheet, View } from 'react-native';", "import { Pressable, View } from 'react-native';")
content = content.replace("import { theme } from '@/core/theme';", "")

content = content.replace(
'''      style={[
        styles.container,
        { backgroundColor: C.primarySurface, borderColor: C.border },
      ]}''',
'''      className="rounded-xl border p-6 mb-4"
      style={{ backgroundColor: C.primarySurface, borderColor: C.border }}'''
)

content = content.replace('style={styles.header}', 'className="flex-row justify-between items-center"')
content = content.replace('style={[styles.title, { color: C.text }]}', 'className="font-bold text-[15px]" style={{ color: C.text }}')
content = content.replace('style={[styles.content, { color: C.subtext }]}', 'className="mt-2 leading-5" style={{ color: C.subtext }}')


# Remove StyleSheet
stylesheet_pattern = re.compile(r"const styles = StyleSheet\.create\(\{[\s\S]*\}\);\s*")
content = stylesheet_pattern.sub("", content)

with open("frontend/src/components/productivity/TodayPlanBanner.tsx", "w") as f:
    f.write(content)
