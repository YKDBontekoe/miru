import re

with open("frontend/src/components/chat/ChatListHeader.tsx", "r") as f:
    content = f.read()

# 1. Update AgentItem signature
content = re.sub(
    r"""const AgentItem = React\.memo\(\(\{
  item,
  selectedAgentId,
  onSelectAgent
\}: \{
  item: Agent;
  selectedAgentId: string \| null;
  onSelectAgent: \(id: string \| null\) => void;
\}\) => \{
  const handlePress = useCallback\(\(\) => \{
    onSelectAgent\(selectedAgentId === item\.id \? null : item\.id\);
  \}, \[item\.id, selectedAgentId, onSelectAgent\]\);""",
    """const AgentItem = React.memo(({
  item,
  isSelected,
  onSelectAgent
}: {
  item: Agent;
  isSelected: boolean;
  onSelectAgent: (id: string | null) => void;
}) => {
  const handlePress = useCallback(() => {
    onSelectAgent(isSelected ? null : item.id);
  }, [item.id, isSelected, onSelectAgent]);""",
    content
)

# 2. Update renderAgentItem
content = re.sub(
    r"""  const renderAgentItem = useCallback\(\(\{ item \}: ListRenderItemInfo<Agent>\) => \(
    <AgentItem item=\{item\} selectedAgentId=\{selectedAgentId\} onSelectAgent=\{onSelectAgent\} />
  \), \[selectedAgentId, onSelectAgent\]\);""",
    """  const renderAgentItem = useCallback(({ item }: ListRenderItemInfo<Agent>) => {
    const isSelected = selectedAgentId === item.id;
    return <AgentItem item={item} isSelected={isSelected} onSelectAgent={onSelectAgent} />;
  }, [selectedAgentId, onSelectAgent]);""",
    content
)

with open("frontend/src/components/chat/ChatListHeader.tsx", "w") as f:
    f.write(content)
