import re

with open("frontend/src/components/productivity/ProductivityTabs.tsx", "r") as f:
    content = f.read()

# Fix translations
content = content.replace("t('productivity.today')", "t('productivity.today') || 'Today'")

# Fix nativewind styling
content = content.replace("import { Pressable, StyleSheet, View } from 'react-native';", "import { Pressable, View } from 'react-native';")
content = content.replace("import { theme } from '@/core/theme';", "")

content = content.replace(
'''        style={[
          styles.tabsContainer,
          { backgroundColor: C.surfaceHigh, borderColor: C.border },
        ]}''',
'''        className="flex-row rounded-xl p-1 mx-6 mt-6 mb-4 border"
        style={{ backgroundColor: C.surfaceHigh, borderColor: C.border }}'''
)

content = content.replace(
'''              style={({ pressed }) => [
                styles.tabButton,
                activeTab === tab && [styles.tabButtonActive, { backgroundColor: C.surface }],
                pressed && activeTab !== tab && { opacity: 0.6 },
              ]}''',
'''              className={`flex-1 py-2 items-center rounded-lg bg-transparent ${activeTab === tab ? 'shadow-sm' : ''}`}
              style={({ pressed }) => [
                activeTab === tab && { backgroundColor: C.surface },
                pressed && activeTab !== tab && { opacity: 0.6 },
              ]}'''
)

content = content.replace(
'''              style={[
                styles.tabText,
                { color: activeTab === tab ? C.text : C.subtext },
                activeTab === tab && styles.tabTextActive,
              ]}''',
'''              className={`text-[14px] ${activeTab === tab ? 'font-bold' : 'font-medium'}`}
              style={{ color: activeTab === tab ? C.text : C.subtext }}'''
)


content = content.replace('style={styles.priorityContainer}', 'className="flex-row flex-wrap mx-6 mb-2"')

content = content.replace(
'''              style={({ pressed }) => [
                styles.priorityButton,
                {
                  borderColor: taskPriority === option.key ? C.primary : C.border,
                  backgroundColor:
                    taskPriority === option.key ? C.primarySurface : C.surface,
                },
                pressed && { opacity: 0.8 },
              ]}''',
'''              className="rounded-xl border px-2.5 py-1.5 mr-2 mb-2"
              style={({ pressed }) => [
                {
                  borderColor: taskPriority === option.key ? C.primary : C.border,
                  backgroundColor:
                    taskPriority === option.key ? C.primarySurface : C.surface,
                },
                pressed && { opacity: 0.8 },
              ]}'''
)

content = content.replace(
'''                style={[
                  styles.priorityText,
                  { color: taskPriority === option.key ? C.primary : C.subtext },
                ]}''',
'''                className="font-bold"
                style={{ color: taskPriority === option.key ? C.primary : C.subtext }}'''
)

# Remove StyleSheet
stylesheet_pattern = re.compile(r"const styles = StyleSheet\.create\(\{[\s\S]*\}\);\s*")
content = stylesheet_pattern.sub("", content)

with open("frontend/src/components/productivity/ProductivityTabs.tsx", "w") as f:
    f.write(content)
