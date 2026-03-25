const fs = require('fs');
const file = 'frontend/app/(auth)/login.tsx';
let content = fs.readFileSync(file, 'utf8');

// I accidentally removed the `t` definition in a previous sed or replace step? Wait...
// Let's check where `t` is defined.
if (!content.includes('const { t } = useTranslation();')) {
  content = content.replace(
    "const { signInWithMagicLink, signInWithPassword, signInWithPasskey } = useAuthStore();",
    "const { signInWithMagicLink, signInWithPassword, signInWithPasskey } = useAuthStore();\n  const { t } = useTranslation();"
  );
}

fs.writeFileSync(file, content);
