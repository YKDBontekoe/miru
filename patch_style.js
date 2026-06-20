const fs = require('fs');

const eventCardPath = 'frontend/src/components/productivity/EventCard.tsx';
let eventContent = fs.readFileSync(eventCardPath, 'utf8');

// Replace event card styles
eventContent = eventContent.replace(
  /<View style=\{styles\.eventCard\}>/,
  `<View className="flex-row items-center bg-white border border-[#DDE8E0] rounded-xl p-4 mb-4 shadow-sm">`
);
eventContent = eventContent.replace(
  /<View style=\{styles\.eventIcon\}>/,
  `<View className="w-8 h-8 rounded-lg bg-[#ECF5F0] items-center justify-center mr-4">`
);
eventContent = eventContent.replace(
  /<View style=\{styles\.eventBody\}>/,
  `<View className="flex-1">`
);
eventContent = eventContent.replace(
  /<AppText style=\{styles\.eventTitle\}>/,
  `<AppText className="text-[#13251C] font-bold text-[15px]">`
);
eventContent = eventContent.replace(
  /<AppText style=\{styles\.eventMeta\}>/,
  `<AppText className="text-[#5A7467] mt-0.5 text-[13px]">`
);
eventContent = eventContent.replace(/const styles = StyleSheet\.create\(\{[\s\S]*?\}\);\n/, '');
eventContent = eventContent.replace(/import \{ View, StyleSheet \} from 'react-native';/, `import { View } from 'react-native';`);

fs.writeFileSync(eventCardPath, eventContent);

const headerPath = 'frontend/src/components/productivity/ProductivityHeader.tsx';
let headerContent = fs.readFileSync(headerPath, 'utf8');

headerContent = headerContent.replace(
  /<View style=\{styles\.headerContainer\}>/,
  `<View className="px-6 pt-4 pb-6 bg-white z-10 shadow-sm">`
);
headerContent = headerContent.replace(
  /<View style=\{styles\.headerRow\}>/,
  `<View className="flex-row justify-between items-center mb-6">`
);
headerContent = headerContent.replace(
  /<AppText variant="h1" style=\{styles\.headerTitle\}>/,
  `<AppText variant="h1" className="text-[#13251C] text-2xl font-extrabold tracking-tight">`
);
headerContent = headerContent.replace(
  /<AppText style=\{styles\.headerSubtitle\}>/,
  `<AppText className="text-[#5A7467] text-sm mt-1">`
);
headerContent = headerContent.replace(
  /<View style=\{styles\.headerActions\}>/,
  `<View className="flex-row gap-2">`
);
headerContent = headerContent.replace(
  /style=\{\(\{ pressed \}\) => \[styles\.iconButton, pressed && \{ opacity: 0\.7 \}\]\}/g,
  `className="w-10 h-10 rounded-full bg-[#ECF5F0] items-center justify-center"\n              style={({ pressed }) => (pressed ? { opacity: 0.7 } : {})}`
);
headerContent = headerContent.replace(
  /<View style=\{styles\.searchContainer\}>/,
  `<View className="flex-row items-center bg-[#F2F7F2] rounded-lg px-4 h-11 border border-[#DDE8E0]">`
);
headerContent = headerContent.replace(
  /style=\{styles\.searchIcon\}/,
  `className="mr-2"`
);
headerContent = headerContent.replace(
  /style=\{styles\.searchInput\}/,
  `className="flex-1 text-[#13251C] text-base h-full"`
);
headerContent = headerContent.replace(/const styles = StyleSheet\.create\(\{[\s\S]*?\}\);\n/, '');
headerContent = headerContent.replace(/import \{ View, TextInput, Pressable, StyleSheet \} from 'react-native';/, `import { View, TextInput, Pressable } from 'react-native';`);

fs.writeFileSync(headerPath, headerContent);


const emptyPath = 'frontend/src/components/productivity/ProductivityEmptyState.tsx';
let emptyContent = fs.readFileSync(emptyPath, 'utf8');

emptyContent = emptyContent.replace(
  /<View style=\{styles\.emptyContainer\}>/,
  `<View className="items-center py-20">`
);
emptyContent = emptyContent.replace(
  /<View style=\{styles\.emptyIconCircle\}>/,
  `<View className="w-20 h-20 rounded-full bg-[#ECF5F0] items-center justify-center mb-6">`
);
emptyContent = emptyContent.replace(
  /<AppText variant="h3" style=\{styles\.emptyTitle\}>/,
  `<AppText variant="h3" className="mb-2 text-center text-[#13251C]">`
);
emptyContent = emptyContent.replace(
  /<AppText style=\{styles\.emptySubtitle\}>/,
  `<AppText className="text-center mb-8 text-[#5A7467] px-12 leading-6">`
);
emptyContent = emptyContent.replace(
  /<View style=\{styles\.emptyActions\}>/,
  `<View className="flex-row gap-4">`
);
emptyContent = emptyContent.replace(
  /style=\{\(\{ pressed \}\) => \[styles\.emptyButton, pressed && \{ opacity: 0\.8 \}\]\}/,
  `className="flex-row items-center bg-[#25C16A] rounded-xl py-3 px-6 shadow-md"\n                style={({ pressed }) => (pressed ? { opacity: 0.8 } : {})}`
);
emptyContent = emptyContent.replace(
  /style=\{styles\.emptyButtonText\}/g,
  `className="text-white font-bold text-[15px]"`
);
emptyContent = emptyContent.replace(
  /style=\{\(\{ pressed \}\) => \[\n\s*styles\.emptyButton,\n\s*\(activeTab === 'all' \|\| activeTab === 'today'\) && styles\.emptyButtonSecondary,\n\s*pressed && \{ opacity: 0\.8 \},\n\s*\]\}/,
  `className={\`flex-row items-center rounded-xl py-3 px-6 \${activeTab === 'all' || activeTab === 'today' ? 'bg-[#ECF5F0]' : 'bg-[#25C16A] shadow-md'}\`}\n                style={({ pressed }) => (pressed ? { opacity: 0.8 } : {})}`
);
emptyContent = emptyContent.replace(
  /style=\{\n\s*activeTab === 'all' \|\| activeTab === 'today'\n\s*\? styles\.emptyButtonTextSecondary\n\s*\: styles\.emptyButtonText\n\s*\}/,
  `className={\`font-bold text-[15px] \${activeTab === 'all' || activeTab === 'today' ? 'text-[#25C16A]' : 'text-white'}\`}`
);
emptyContent = emptyContent.replace(/const styles = StyleSheet\.create\(\{[\s\S]*?\}\);\n/, '');
emptyContent = emptyContent.replace(/import \{ View, Pressable, Platform, StyleSheet \} from 'react-native';/, `import { View, Pressable } from 'react-native';`);

fs.writeFileSync(emptyPath, emptyContent);

const prodPath = 'frontend/app/(main)/productivity.tsx';
let prodContent = fs.readFileSync(prodPath, 'utf8');

// The productivity styling comments from CodeRabbit specifically mention:
// priorityFilterContainer, priorityFilterButton, listContent, todayPlanContainer, todayPlanHeader, todayPlanTitle, todayPlanText
prodContent = prodContent.replace(
  /<View style=\{styles\.priorityFilterContainer\}>/,
  `<View className="flex-row flex-wrap mx-6 mb-2">`
);
prodContent = prodContent.replace(
  /styles\.priorityFilterButton,/g,
  `{ borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8, marginBottom: 8 },`
);
prodContent = prodContent.replace(
  /contentContainerStyle=\{styles\.listContent\}/,
  `contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100, paddingTop: 12 }}`
);
prodContent = prodContent.replace(
  /<View style=\{styles\.todayPlanContainer\}>/,
  `<View className="rounded-xl bg-[#ECF5F0] border border-[#DDE8E0] p-6 mb-4">`
);
prodContent = prodContent.replace(
  /<View style=\{styles\.todayPlanHeader\}>/,
  `<View className="flex-row justify-between items-center">`
);
prodContent = prodContent.replace(
  /<AppText style=\{styles\.todayPlanTitle\}>/,
  `<AppText className="text-[#13251C] font-bold text-[15px]">`
);
prodContent = prodContent.replace(
  /<AppText style=\{styles\.todayPlanText\}>/,
  `<AppText className="text-[#5A7467] mt-2 leading-5">`
);

// Delete the specific styles
prodContent = prodContent.replace(/  priorityFilterContainer: \{[\s\S]*?\},\n/, '');
prodContent = prodContent.replace(/  priorityFilterButton: \{[\s\S]*?\},\n/, '');
prodContent = prodContent.replace(/  listContent: \{[\s\S]*?\},\n/, '');
prodContent = prodContent.replace(/  todayPlanContainer: \{[\s\S]*?\},\n/, '');
prodContent = prodContent.replace(/  todayPlanHeader: \{[\s\S]*?\},\n/, '');
prodContent = prodContent.replace(/  todayPlanTitle: \{[\s\S]*?\},\n/, '');
prodContent = prodContent.replace(/  todayPlanText: \{[\s\S]*?\},\n/, '');

fs.writeFileSync(prodPath, prodContent);
