const fs = require('fs');
const file = 'frontend/app/(auth)/login.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes("import { useTranslation } from 'react-i18next';")) {
  content = content.replace(
    "import { useAuthStore } from '../../src/store/useAuthStore';",
    "import { useAuthStore } from '../../src/store/useAuthStore';\nimport { useTranslation } from 'react-i18next';"
  );
}

fs.writeFileSync(file, content);
