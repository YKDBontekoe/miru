--- frontend/app/(main)/chat.tsx
+++ frontend/app/(main)/chat.tsx
@@ -16,6 +16,7 @@
 import { useTranslation } from 'react-i18next';
 import { AppText } from '../../src/components/AppText';
 import { useChatStore } from '../../src/store/useChatStore';
+import { ApiService } from '../../src/core/api/ApiService';
 import { useAgentStore } from '../../src/store/useAgentStore';
 import { ChatRoom, Agent } from '../../src/core/models';
