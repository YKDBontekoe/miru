import re

with open("frontend/src/components/productivity/ProductivityEmptyState.tsx", "r") as f:
    content = f.read()

# Fix translations
content = content.replace("t('productivity.no_matches') || 'No matches found'", "t('productivity.no_matches', 'No matches found')")
content = content.replace("t('productivity.no_notes') || 'No Notes'", "t('productivity.no_notes', 'No Notes')")
content = content.replace("t('productivity.no_tasks') || 'No Tasks'", "t('productivity.no_tasks', 'No Tasks')")
content = content.replace("t('productivity.nothing_urgent_today')", "t('productivity.nothing_urgent_today', 'Nothing urgent today')")
content = content.replace("t('productivity.workspace_clear') || 'Your workspace is clear'", "t('productivity.workspace_clear', 'Your workspace is clear')")

content = content.replace("t('productivity.try_adjust_search') || 'Try adjusting your search terms.'", "t('productivity.try_adjust_search', 'Try adjusting your search terms.')")
content = content.replace("t('productivity.today_empty_detail')", "t('productivity.today_empty_detail', 'Take a moment to plan your day.')")
content = content.replace("t('productivity.capture_thoughts') ||\n              'Capture your thoughts and track what needs to get done.'", "t('productivity.capture_thoughts', 'Capture your thoughts and track what needs to get done.')")

content = content.replace("t('productivity.newNote') || 'New Note'", "t('productivity.newNote', 'New Note')")
content = content.replace("t('productivity.new_task')", "t('productivity.new_task', 'New Task')")


# Fix nativewind styling
content = content.replace("import { Platform, Pressable, StyleSheet, View } from 'react-native';", "import { Platform, Pressable, View } from 'react-native';")
content = content.replace("import { theme } from '@/core/theme';", "")
content = content.replace("style={styles.emptyContainer}", 'className="items-center py-20"')
content = content.replace("style={[styles.emptyIconCircle, { backgroundColor: C.primarySurface }]}", 'className="w-20 h-20 rounded-full items-center justify-center mb-6" style={{ backgroundColor: C.primarySurface }}')
content = content.replace('variant="h3" style={[styles.emptyTitle, { color: C.text }]}', 'variant="h3" className="mb-2 text-center" style={{ color: C.text }}')
content = content.replace('style={[styles.emptySubtitle, { color: C.subtext }]}', 'className="text-center mb-8 px-10 leading-6" style={{ color: C.subtext }}')
content = content.replace('style={styles.emptyActions}', 'className="flex-row gap-4"')

content = content.replace(
'''              style={({ pressed }) => [
                styles.emptyButton,
                { backgroundColor: C.primary },
                pressed && { opacity: 0.8 },
              ]}''',
'''              className="flex-row items-center rounded-xl py-4 px-6 shadow-md"
              style={({ pressed }) => [
                { backgroundColor: C.primary },
                pressed && { opacity: 0.8 },
              ]}'''
)

content = content.replace('style={styles.iconMargin}', 'className="mr-1.5"')
content = content.replace('style={styles.emptyButtonText}', 'className="text-white font-bold text-[15px]"')


content = content.replace(
'''              style={({ pressed }) => [
                styles.emptyButton,
                (activeTab === 'all' || activeTab === 'today') && [
                  styles.emptyButtonSecondary,
                  { backgroundColor: C.primarySurface },
                ],
                !(activeTab === 'all' || activeTab === 'today') && { backgroundColor: C.primary },
                pressed && { opacity: 0.8 },
              ]}''',
'''              className={`flex-row items-center rounded-xl py-4 px-6 ${activeTab === 'all' || activeTab === 'today' ? (Platform.OS === 'ios' ? 'shadow-none' : 'elevation-0') : 'shadow-md'}`}
              style={({ pressed }) => [
                (activeTab === 'all' || activeTab === 'today') ? { backgroundColor: C.primarySurface } : { backgroundColor: C.primary },
                pressed && { opacity: 0.8 },
              ]}'''
)

content = content.replace(
'''                style={
                  activeTab === 'all' || activeTab === 'today'
                    ? [styles.emptyButtonTextSecondary, { color: C.primary }]
                    : styles.emptyButtonText
                }''',
'''                className="font-bold text-[15px]"
                style={
                  activeTab === 'all' || activeTab === 'today'
                    ? { color: C.primary }
                    : { color: '#FFFFFF' }
                }'''
)


# Remove StyleSheet
stylesheet_pattern = re.compile(r"const styles = StyleSheet\.create\(\{[\s\S]*\}\);\s*")
content = stylesheet_pattern.sub("", content)


with open("frontend/src/components/productivity/ProductivityEmptyState.tsx", "w") as f:
    f.write(content)
