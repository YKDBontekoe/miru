const fs = require('fs');

const productivityPath = 'frontend/app/(main)/productivity.tsx';
let productivityContent = fs.readFileSync(productivityPath, 'utf8');

// 1. Fix relative imports
productivityContent = productivityContent.replace(/\.\.\/\.\.\/src\//g, '@/');

// 2. Fix empty state conditional render & add ActivityIndicator
// Add ActivityIndicator to imports
productivityContent = productivityContent.replace(/import \{ Alert, FlatList, Pressable, RefreshControl, StyleSheet, View \} from 'react-native';/, "import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, View, ActivityIndicator } from 'react-native';");

// Use error state in the component
productivityContent = productivityContent.replace(/  const \{\n    activeTab,/, "  const {\n    error,\n    activeTab,");

// Update ListEmptyComponent
const listEmptyReplacement = `ListEmptyComponent={
          isLoading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={T.primary.DEFAULT} />
            </View>
          ) : error ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
               <AppText style={{ color: DESIGN_TOKENS.colors.error, textAlign: 'center' }}>{error}</AppText>
            </View>
          ) : (
            <ProductivityEmptyState
              activeTab={activeTab}
              searchQuery={searchQuery}
              onAddNote={() => setShowCreateNote(true)}
              onAddTask={() => setShowCreateTask(true)}
            />
          )
        }`;
productivityContent = productivityContent.replace(/ListEmptyComponent=\{\s*<ProductivityEmptyState[\s\S]*?\/>\s*\}/, listEmptyReplacement);

// 3. Fix accessibility label for TodayPlan close button
productivityContent = productivityContent.replace(/<Pressable onPress=\{\(\) => setTodayPlan\(null\)\}>/, `<Pressable onPress={() => setTodayPlan(null)} accessibilityLabel="Dismiss today plan" accessible={true} accessibilityRole="button">`);

fs.writeFileSync(productivityPath, productivityContent);


const useProductivityDataPath = 'frontend/src/hooks/useProductivityData.ts';
let useProductivityDataContent = fs.readFileSync(useProductivityDataPath, 'utf8');

// 1. Export Interface instead of type
useProductivityDataContent = useProductivityDataContent.replace(/export type RenderItemData = \{/, "export interface RenderItemData {");

// 2. Add error from useProductivityStore
useProductivityDataContent = useProductivityDataContent.replace(/    events,\n    fetchNotes,/, "    events,\n    error,\n    fetchNotes,");

// 3. Return error
useProductivityDataContent = useProductivityDataContent.replace(/    activeTab,\n    setActiveTab,/, "    error,\n    activeTab,\n    setActiveTab,");

fs.writeFileSync(useProductivityDataPath, useProductivityDataContent);

const productivityHeaderPath = 'frontend/src/components/productivity/ProductivityHeader.tsx';
let headerContent = fs.readFileSync(productivityHeaderPath, 'utf8');

// 1. Accessibility labels on icon buttons
headerContent = headerContent.replace(
  /<Pressable\s+onPress=\{onGeneratePlan\}\s+style=\{[\s\S]*?\}\s*>/,
  `<Pressable
              onPress={onGeneratePlan}
              style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
              accessibilityLabel="Generate productivity plan"
              accessibilityHint="Generates a plan for the day based on tasks and events"
              accessibilityRole="button"
            >`
);

headerContent = headerContent.replace(
  /<Pressable\s+onPress=\{onAddNote\}\s+style=\{[\s\S]*?\}\s*>/,
  `<Pressable
              onPress={onAddNote}
              style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
              accessibilityLabel="Add note"
              accessibilityHint="Opens a modal to create a new note"
              accessibilityRole="button"
            >`
);

headerContent = headerContent.replace(
  /<Pressable\s+onPress=\{onAddTask\}\s+style=\{[\s\S]*?\}\s*>/,
  `<Pressable
              onPress={onAddTask}
              style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
              accessibilityLabel="Add task"
              accessibilityHint="Opens a modal to create a new task"
              accessibilityRole="button"
            >`
);

// 2. Add Debounce to search query
// Add hook import
headerContent = headerContent.replace(/import \{ AppText \} from '\.\.\/AppText';/, `import { AppText } from '../AppText';\nimport { useDebounce } from '@/hooks/useDebounce';\nimport { useState, useEffect } from 'react';`);

// Inside component
const headerPropsReplacement = `  ({
    pendingTasksCount,
    searchQuery,
    setSearchQuery,
    onGeneratePlan,
    onAddNote,
    onAddTask,
  }: ProductivityHeaderProps) => {
    const { t } = useTranslation();
    const [localQuery, setLocalQuery] = useState(searchQuery);
    const debouncedQuery = useDebounce(localQuery, 300);

    useEffect(() => {
      setSearchQuery(debouncedQuery);
    }, [debouncedQuery, setSearchQuery]);`;

headerContent = headerContent.replace(/  \(\{\s*pendingTasksCount,\s*searchQuery,\s*setSearchQuery,\s*onGeneratePlan,\s*onAddNote,\s*onAddTask,\s*\}\:\s*ProductivityHeaderProps\)\s*=>\s*\{\s*const \{ t \} = useTranslation\(\);/, headerPropsReplacement);

// Update TextInput
headerContent = headerContent.replace(/value=\{searchQuery\}\s*onChangeText=\{setSearchQuery\}/, `value={localQuery}\n            onChangeText={setLocalQuery}`);


fs.writeFileSync(productivityHeaderPath, headerContent);
