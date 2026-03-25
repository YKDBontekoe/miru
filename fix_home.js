const fs = require('fs');
const file = 'frontend/app/(main)/home.tsx';
let content = fs.readFileSync(file, 'utf8');

// I removed `i18n` but `formatDate(i18n.language)` needs it in HomeScreen.
// Let's add it back in HomeScreen, and remove it from `RecentChatRow`.
content = content.replace(
  "export default function HomeScreen() {\n  const { t } = useTranslation();",
  "export default function HomeScreen() {\n  const { t, i18n } = useTranslation();"
);

// We need to find RecentChatRow and remove i18n
content = content.replace(
  "function RecentChatRow({ room, onPress }: { room: ChatRoom; onPress: () => void }) {\n  const { t, i18n } = useTranslation();",
  "function RecentChatRow({ room, onPress }: { room: ChatRoom; onPress: () => void }) {\n  const { t } = useTranslation();"
);

fs.writeFileSync(file, content);
