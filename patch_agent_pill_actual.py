with open("frontend/src/components/chat/AgentPill.tsx", "r") as f:
    content = f.read()

import re

# Update AgentPill props interface
content = re.sub(
    r"""export interface AgentPillProps \{
  /\*\* The agent data to display\. \*/
  agent: Agent;
  /\*\* Callback fired when the pill is pressed\. \*/
  onPress: \(\) => void;
\}""",
    """export interface AgentPillProps {
  /** The agent data to display. */
  agent: Agent;
  /** Callback fired when the pill is pressed. */
  onPress: () => void;
  selected?: boolean;
}""",
    content
)

# Update AgentPill component signature
content = re.sub(
    r"""export const AgentPill = React\.memo\(\(\{ agent, onPress \}: AgentPillProps\) => \{""",
    """export const AgentPill = React.memo(({ agent, onPress, selected = false }: AgentPillProps) => {""",
    content
)

# Update the className in ScalePressable inside AgentPill
content = re.sub(
    r"""<View
        className="w-\[52px\] h-\[52px\] rounded-full items-center justify-center mb-1\.5 border-\[1\.5px\]\"""",
    """<View
        className={`w-[52px] h-[52px] rounded-full items-center justify-center mb-1.5 border-[1.5px] ${selected ? 'border-[#147D64] bg-[#DDF4EB]' : ''}`}""",
    content
)

with open("frontend/src/components/chat/AgentPill.tsx", "w") as f:
    f.write(content)
