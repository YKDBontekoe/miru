with open("frontend/src/components/chat/AgentPill.tsx", "r") as f:
    content = f.read()

import re

# Update AgentPill props interface
content = re.sub(
    r"""interface AgentPillProps \{
  agent: Agent;
  onPress: \(\) => void;
\}""",
    """interface AgentPillProps {
  agent: Agent;
  onPress: () => void;
  selected?: boolean;
}""",
    content
)

# Update AgentPill component signature
content = re.sub(
    r"""export function AgentPill\(\{ agent, onPress \}: AgentPillProps\) \{""",
    """export function AgentPill({ agent, onPress, selected = false }: AgentPillProps) {""",
    content
)

# Update the className in ScalePressable inside AgentPill
content = re.sub(
    r"""      className="flex-row items-center bg-\[\#ECF5F0\] border border-\[\#DDE8E0\] rounded-full px-3 py-1.5 h-\[36px\]\"""",
    """      className={`flex-row items-center rounded-full px-3 py-1.5 h-[36px] ${
        selected ? 'bg-[#DDF4EB] border-[#147D6473]' : 'bg-[#ECF5F0] border-[#DDE8E0]'
      }`}\"""",
    content
)

with open("frontend/src/components/chat/AgentPill.tsx", "w") as f:
    f.write(content)
