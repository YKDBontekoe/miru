const fs = require('fs');
let code = fs.readFileSync('frontend/app/(main)/chat.tsx', 'utf8');

code = code.replace(
  "contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 20 }}",
  "contentContainerStyle={{ paddingBottom: 24 }}"
);

code = code.replace(
  "  agentsListContent: { paddingHorizontal: 20, paddingBottom: 4 },",
  "  agentsListContent: { paddingHorizontal: 20, paddingBottom: 4 },"
);

// we need room cards to have horizontal padding
code = code.replace(
  "  roomCardContainer: {",
  "  roomCardContainer: {\n    marginHorizontal: 20,"
);

code = code.replace(
  "  chatsTitle: {",
  "  chatsTitle: {\n    marginHorizontal: 20,"
);

fs.writeFileSync('frontend/app/(main)/chat.tsx', code);
