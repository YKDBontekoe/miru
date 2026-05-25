import re

with open("frontend/app/(main)/productivity.tsx", "r") as f:
    productivity_content = f.read()

# 1. Update export default function -> export const
productivity_content = productivity_content.replace(
    "export default function ProductivityScreen() {",
    "export const ProductivityScreen = () => {"
)
productivity_content = productivity_content.replace(
    "});\n",
    "});\n\nexport default ProductivityScreen;\n"
)

# 2. Update relative imports
productivity_content = productivity_content.replace(
    "import { AppText } from '../../src/components/AppText';",
    "import { AppText } from '@/components/AppText';"
)
productivity_content = productivity_content.replace(
    "import { CreateNoteModal } from '../../src/components/productivity/CreateNoteModal';",
    "import { CreateNoteModal } from '@/components/productivity/CreateNoteModal';"
)
productivity_content = productivity_content.replace(
    "import { CreateTaskModal } from '../../src/components/productivity/CreateTaskModal';",
    "import { CreateTaskModal } from '@/components/productivity/CreateTaskModal';"
)
productivity_content = productivity_content.replace(
    "import { NoteCard } from '../../src/components/productivity/NoteCard';",
    "import { NoteCard } from '@/components/productivity/NoteCard';"
)
productivity_content = productivity_content.replace(
    "import { TaskCard } from '../../src/components/productivity/TaskCard';",
    "import { TaskCard } from '@/components/productivity/TaskCard';"
)
productivity_content = productivity_content.replace(
    "import { EventCard } from '../../src/components/productivity/EventCard';",
    "import { EventCard } from '@/components/productivity/EventCard';"
)
productivity_content = productivity_content.replace(
    "import { ProductivityEmptyState } from '../../src/components/productivity/ProductivityEmptyState';",
    "import { ProductivityEmptyState } from '@/components/productivity/ProductivityEmptyState';"
)
productivity_content = productivity_content.replace(
    "import { theme } from '../../src/core/theme';",
    "import { theme } from '@/core/theme';"
)
productivity_content = productivity_content.replace(
    "} from '../../src/hooks/useProductivityViewModel';",
    "} from '@/hooks/useProductivityViewModel';"
)

# 3. Update style to className on productivity.tsx view
productivity_content = productivity_content.replace(
    """        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginHorizontal: S.xl,
            marginBottom: S.sm,
          }}
        >""",
    """        <View className="flex-row flex-wrap mx-5 mb-2">"""
)

with open("frontend/app/(main)/productivity.tsx", "w") as f:
    f.write(productivity_content)


with open("frontend/src/components/productivity/EventCard.tsx", "r") as f:
    event_card_content = f.read()

# 4. AppText import in EventCard
event_card_content = event_card_content.replace(
    "import { AppText } from '../AppText';",
    "import { AppText } from '@/components/AppText';"
)

# 5. export function EventCard -> export const EventCard = ...
event_card_content = event_card_content.replace(
    "export function EventCard({ event }: EventCardProps) {",
    "export const EventCard = ({ event }: EventCardProps) => {"
)

# 6. EventCard styles to tailwind
event_card_content = event_card_content.replace(
    """<View style={styles.eventCard}>""",
    """<View className="flex-row items-center bg-white border border-gray-200 rounded-2xl p-4 mb-3 shadow-sm">"""
)
event_card_content = event_card_content.replace(
    """<View style={styles.eventIcon}>""",
    """<View className="w-8 h-8 rounded-2xl bg-blue-50 items-center justify-center mr-3">"""
)
event_card_content = event_card_content.replace(
    """<View style={styles.eventBody}>""",
    """<View className="flex-1">"""
)
event_card_content = event_card_content.replace(
    """<AppText style={styles.eventTitle}>{event.title}</AppText>""",
    """<AppText className="text-gray-900 font-bold text-[15px]">{event.title}</AppText>"""
)
event_card_content = event_card_content.replace(
    """<AppText style={styles.eventMeta}>""",
    """<AppText className="text-gray-500 mt-0.5 text-[13px]">"""
)

# Remove stylesheet from event card
event_card_content = re.sub(r'const styles = StyleSheet\.create\(\{[\s\S]*\}\);\n', '', event_card_content)

with open("frontend/src/components/productivity/EventCard.tsx", "w") as f:
    f.write(event_card_content)


with open("frontend/src/components/productivity/ProductivityEmptyState.tsx", "r") as f:
    empty_state_content = f.read()

# 7. AppText import in ProductivityEmptyState
empty_state_content = empty_state_content.replace(
    "import { AppText } from '../AppText';",
    "import { AppText } from '@/components/AppText';"
)

# 8. Nullish coalescing in ProductivityEmptyState
empty_state_content = empty_state_content.replace(
    "|| 'No matches found'",
    "?? 'No matches found'"
)
empty_state_content = empty_state_content.replace(
    "|| 'No Notes'",
    "?? 'No Notes'"
)
empty_state_content = empty_state_content.replace(
    "|| 'No Tasks'",
    "?? 'No Tasks'"
)
empty_state_content = empty_state_content.replace(
    "|| 'Nothing urgent today'",
    "?? 'Nothing urgent today'"
)
empty_state_content = empty_state_content.replace(
    "|| 'Your workspace is clear'",
    "?? 'Your workspace is clear'"
)
empty_state_content = empty_state_content.replace(
    "|| 'Try adjusting your search terms.'",
    "?? 'Try adjusting your search terms.'"
)
empty_state_content = empty_state_content.replace(
    "|| 'Enjoy the rest of your day, or get ahead on upcoming tasks.'",
    "?? 'Enjoy the rest of your day, or get ahead on upcoming tasks.'"
)
empty_state_content = empty_state_content.replace(
    "|| 'Capture your thoughts and track what needs to get done.'",
    "?? 'Capture your thoughts and track what needs to get done.'"
)
empty_state_content = empty_state_content.replace(
    "|| 'New Note'",
    "?? 'New Note'"
)
empty_state_content = empty_state_content.replace(
    "|| 'New Task'",
    "?? 'New Task'"
)

# 9. Tailwind conversion in ProductivityEmptyState (partial replacement)
empty_state_content = empty_state_content.replace(
    "export function ProductivityEmptyState({",
    "export const ProductivityEmptyState: React.FC<ProductivityEmptyStateProps> = ({"
)
empty_state_content = empty_state_content.replace(
    "}: ProductivityEmptyStateProps) {",
    "}) => {"
)
empty_state_content = empty_state_content.replace(
    "style={styles.emptyContainer}",
    "className=\"items-center py-12\""
)
empty_state_content = empty_state_content.replace(
    "style={styles.emptyIconCircle}",
    "className=\"w-20 h-20 rounded-full bg-blue-50 items-center justify-center mb-4\""
)
empty_state_content = empty_state_content.replace(
    "style={styles.emptyTitle}",
    "className=\"mb-2 text-center text-gray-900\""
)
empty_state_content = empty_state_content.replace(
    "style={styles.emptySubtitle}",
    "className=\"text-center mb-5 text-gray-500 px-8 leading-6\""
)
empty_state_content = empty_state_content.replace(
    "style={styles.emptyActions}",
    "className=\"flex-row gap-3\""
)
empty_state_content = empty_state_content.replace(
    "style={({ pressed }) => [styles.emptyButton, pressed && { opacity: 0.8 }]}",
    "className={({ pressed }) => `flex-row items-center bg-blue-600 rounded-2xl py-3 px-5 shadow-md ${pressed ? 'opacity-80' : ''}`}"
)
empty_state_content = empty_state_content.replace(
    "style={({ pressed }) => [\n                styles.emptyButton,\n                (activeTab === 'all' || activeTab === 'today') && styles.emptyButtonSecondary,\n                pressed && { opacity: 0.8 },\n              ]}",
    "className={({ pressed }) => `flex-row items-center rounded-2xl py-3 px-5 ${(activeTab === 'all' || activeTab === 'today') ? 'bg-blue-50 shadow-none' : 'bg-blue-600 shadow-md'} ${pressed ? 'opacity-80' : ''}`}"
)
empty_state_content = empty_state_content.replace(
    "style={styles.emptyButtonText}",
    "className=\"text-white font-bold text-[15px]\""
)
empty_state_content = empty_state_content.replace(
    "style={\n                  activeTab === 'all' || activeTab === 'today'\n                    ? styles.emptyButtonTextSecondary\n                    : styles.emptyButtonText\n                }",
    "className={(activeTab === 'all' || activeTab === 'today') ? \"text-blue-600 font-bold text-[15px]\" : \"text-white font-bold text-[15px]\"}"
)

# Remove StyleSheet
empty_state_content = re.sub(r'const styles = StyleSheet\.create\(\{[\s\S]*\}\);\n', '', empty_state_content)

with open("frontend/src/components/productivity/ProductivityEmptyState.tsx", "w") as f:
    f.write(empty_state_content)


with open("frontend/src/hooks/useProductivityViewModel.ts", "r") as f:
    view_model_content = f.read()

# 10. useDebounce import + hook insertion
view_model_content = view_model_content.replace(
    "import { useProductivityStore } from '@/store/useProductivityStore';",
    "import { useProductivityStore } from '@/store/useProductivityStore';\nimport { useDebounce } from '@/hooks/useDebounce';"
)
view_model_content = view_model_content.replace(
    "const [searchQuery, setSearchQuery] = useState('');",
    "const [inputQuery, setInputQuery] = useState('');\n  const debouncedQuery = useDebounce(inputQuery, 300);"
)
view_model_content = view_model_content.replace(
    "if (!searchQuery) return notes;\n    const lowerQ = searchQuery.toLowerCase();",
    "if (!debouncedQuery) return notes;\n    const lowerQ = debouncedQuery.toLowerCase();"
)
view_model_content = view_model_content.replace(
    "if (!searchQuery) return tasks;\n    const lowerQ = searchQuery.toLowerCase();",
    "if (!debouncedQuery) return tasks;\n    const lowerQ = debouncedQuery.toLowerCase();"
)
view_model_content = view_model_content.replace(
    "if (!searchQuery) return events;\n    const lowerQ = searchQuery.toLowerCase();",
    "if (!debouncedQuery) return events;\n    const lowerQ = debouncedQuery.toLowerCase();"
)
view_model_content = view_model_content.replace(
    "[notes, searchQuery]",
    "[notes, debouncedQuery]"
)
view_model_content = view_model_content.replace(
    "[searchQuery, tasks]",
    "[debouncedQuery, tasks]"
)
view_model_content = view_model_content.replace(
    "[events, searchQuery]",
    "[events, debouncedQuery]"
)
view_model_content = view_model_content.replace(
    "searchQuery,\n    setSearchQuery",
    "searchQuery: inputQuery,\n    setSearchQuery: setInputQuery"
)

# 11. async wrapper for confirmDelete
view_model_content = view_model_content.replace(
    "onPress: () => action(),",
    "onPress: async () => {\n              try {\n                await action();\n              } catch (error) {\n                Alert.alert('Error', 'Failed to delete item.');\n              }\n            },"
)

# 12. date-only parsing in getTaskPriority
view_model_content = view_model_content.replace(
    "const due = new Date(task.due_date);",
    """let due = new Date(task.due_date);
    if (task.due_date.includes('-') && task.due_date.length === 10) {
      const [year, month, day] = task.due_date.split('-').map(Number);
      due = new Date(year, month - 1, day);
    }"""
)

# Replace the ranking sorter to also use date-only parsing
view_model_content = view_model_content.replace(
    "const aDue = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;\n      const bDue = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;",
    """let aDueObj = a.due_date ? new Date(a.due_date) : null;
      if (a.due_date && a.due_date.length === 10) {
        const [year, month, day] = a.due_date.split('-').map(Number);
        aDueObj = new Date(year, month - 1, day);
      }
      let bDueObj = b.due_date ? new Date(b.due_date) : null;
      if (b.due_date && b.due_date.length === 10) {
        const [year, month, day] = b.due_date.split('-').map(Number);
        bDueObj = new Date(year, month - 1, day);
      }
      const aDue = aDueObj ? aDueObj.getTime() : Number.MAX_SAFE_INTEGER;
      const bDue = bDueObj ? bDueObj.getTime() : Number.MAX_SAFE_INTEGER;"""
)

with open("frontend/src/hooks/useProductivityViewModel.ts", "w") as f:
    f.write(view_model_content)
