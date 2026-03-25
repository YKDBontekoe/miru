const fs = require('fs');
const file = 'frontend/src/components/agents/AgentDetailSheet.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('const { t, i18n } = useTranslation();')) {
  content = content.replace(
    'const { t } = useTranslation();',
    'const { t, i18n } = useTranslation();'
  );
}

fs.writeFileSync(file, content);
