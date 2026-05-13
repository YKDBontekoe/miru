import re

with open("frontend/src/components/productivity/ProductivityHeader.tsx", "r") as f:
    content = f.read()

# Fix native wind styling
content = content.replace("import { Pressable, StyleSheet, TextInput, View } from 'react-native';", "import { Pressable, TextInput, View } from 'react-native';")
content = content.replace("import { theme } from '@/core/theme';", "")
content = content.replace('style={[styles.headerContainer, { backgroundColor: C.surface }]}', 'className="px-6 pt-4 pb-6 shadow-sm z-10" style={{ backgroundColor: C.surface }}')
content = content.replace('style={styles.headerRow}', 'className="flex-row justify-between items-center mb-6"')
content = content.replace('variant="h1" style={[styles.headerTitle, { color: C.text }]}', 'variant="h1" className="text-[28px] font-[800] tracking-[-0.5px]" style={{ color: C.text }}')
content = content.replace('style={[styles.headerSubtitle, { color: C.subtext }]}', 'className="text-[14px] mt-1" style={{ color: C.subtext }}')

content = content.replace('style={styles.headerActions}', 'className="flex-row gap-2"')

button_replacement = '''              className="w-10 h-10 rounded-full items-center justify-center"
              style={({ pressed }) => [
                { backgroundColor: C.primarySurface },
                pressed && { opacity: 0.7 },
              ]}'''

content = content.replace(
'''              style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: C.primarySurface },
              pressed && { opacity: 0.7 },
            ]}''', button_replacement
)


content = content.replace('style={[styles.searchContainer, { backgroundColor: C.bg, borderColor: C.border }]}', 'className="flex-row items-center rounded-lg px-4 h-11 border" style={{ backgroundColor: C.bg, borderColor: C.border }}')
content = content.replace('style={styles.searchIcon}', 'className="mr-2"')
content = content.replace('style={[styles.searchInput, { color: C.text }]}', 'className="flex-1 text-[16px] h-full" style={{ color: C.text }}')

# Add debounce
content = content.replace(
'''export const ProductivityHeader = React.memo(function ProductivityHeader({
  pendingTasksCount,
  searchQuery,
  setSearchQuery,
  onGeneratePlan,
  onCreateNote,
  onCreateTask,
}: ProductivityHeaderProps) {
  const { t } = useTranslation();
  const { C } = useTheme();''',
'''import { useDebounce } from '@/hooks/useDebounce';
export const ProductivityHeader = React.memo(function ProductivityHeader({
  pendingTasksCount,
  searchQuery,
  setSearchQuery,
  onGeneratePlan,
  onCreateNote,
  onCreateTask,
}: ProductivityHeaderProps) {
  const { t } = useTranslation();
  const { C } = useTheme();

  const [localQuery, setLocalQuery] = React.useState(searchQuery);
  const debouncedSetSearchQuery = useDebounce(setSearchQuery, 300);

  React.useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (q: string) => {
    setLocalQuery(q);
    debouncedSetSearchQuery(q);
  };
'''
)

content = content.replace('value={searchQuery}', 'value={localQuery}')
content = content.replace('onChangeText={setSearchQuery}', 'onChangeText={handleSearchChange}')

# Add accessibility
content = content.replace('<Pressable\n            onPress={onGeneratePlan}', '<Pressable\n            onPress={onGeneratePlan}\n            accessibilityRole="button"\n            accessibilityLabel="Generate plan"\n            accessibilityHint="Generates a today plan"')
content = content.replace('<Pressable\n            onPress={onCreateNote}', '<Pressable\n            onPress={onCreateNote}\n            accessibilityRole="button"\n            accessibilityLabel="Create note"\n            accessibilityHint="Creates a new note"')
content = content.replace('<Pressable\n            onPress={onCreateTask}', '<Pressable\n            onPress={onCreateTask}\n            accessibilityRole="button"\n            accessibilityLabel="Create task"\n            accessibilityHint="Creates a new task"')


# Remove StyleSheet
stylesheet_pattern = re.compile(r"const styles = StyleSheet\.create\(\{[\s\S]*\}\);\s*")
content = stylesheet_pattern.sub("", content)


with open("frontend/src/components/productivity/ProductivityHeader.tsx", "w") as f:
    f.write(content)
