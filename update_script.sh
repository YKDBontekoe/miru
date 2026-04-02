# 1. frontend/app/(main)/chat/[id].tsx
# Change imports to use project's absolute alias.
sed -i "s|'../../../src/components/chat/ChatRoomEmptyState'|'@/components/chat/ChatRoomEmptyState'|g" frontend/app/\(main\)/chat/\[id\].tsx
sed -i "s|'../../../src/hooks/useChatRoomSetup'|'@/hooks/useChatRoomSetup'|g" frontend/app/\(main\)/chat/\[id\].tsx
sed -i "s|'../../../src/utils/chatUtils'|'@/utils/chatUtils'|g" frontend/app/\(main\)/chat/\[id\].tsx
sed -i "s|'../../../src/components/ChatBubble'|'@/components/ChatBubble'|g" frontend/app/\(main\)/chat/\[id\].tsx
sed -i "s|'../../../src/components/ChatInputBar'|'@/components/ChatInputBar'|g" frontend/app/\(main\)/chat/\[id\].tsx
sed -i "s|'../../../src/components/AgentActivityIndicator'|'@/components/AgentActivityIndicator'|g" frontend/app/\(main\)/chat/\[id\].tsx
sed -i "s|'../../../src/store/useChatStore'|'@/store/useChatStore'|g" frontend/app/\(main\)/chat/\[id\].tsx
sed -i "s|'../../../src/store/useAgentStore'|'@/store/useAgentStore'|g" frontend/app/\(main\)/chat/\[id\].tsx
sed -i "s|'../../../src/core/api/ApiService'|'@/core/api/ApiService'|g" frontend/app/\(main\)/chat/\[id\].tsx
sed -i "s|'../../../src/core/models'|'@/core/models'|g" frontend/app/\(main\)/chat/\[id\].tsx
sed -i "s|'../../../src/components/agents/QuickViewAgentSheet'|'@/components/agents/QuickViewAgentSheet'|g" frontend/app/\(main\)/chat/\[id\].tsx
