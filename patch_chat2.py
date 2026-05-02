with open("frontend/src/components/chat/ChatListHeader.tsx", "r") as f:
    content = f.read()

import re

# Update the call to AgentPill in AgentItem
content = re.sub(
    r"""      <AgentPill
        agent=\{item\}
        onPress=\{handlePress\}
      />""",
    """      <AgentPill
        agent={item}
        onPress={handlePress}
        selected={isSelected}
      />""",
    content
)

with open("frontend/src/components/chat/ChatListHeader.tsx", "w") as f:
    f.write(content)
