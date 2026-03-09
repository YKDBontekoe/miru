import re

with open("frontend/lib/group_chat_page.dart", "r") as f:
    content = f.read()

content = content.replace("ApiService.getRoomAgents", "ApiService.getRoomAgents")
content = content.replace("final agentsData = await _apiService.getRoomAgents(widget.room.id);", "final agentsData = await ApiService.getRoomAgents(widget.room.id);")
content = content.replace("final messagesData = await _apiService.getRoomMessages(widget.room.id);", "final messagesData = await ApiService.getRoomMessages(widget.room.id);")

content = content.replace("final stream = _apiService.streamRoomChat(widget.room.id, userMessageText);", "final stream = ApiService.streamRoomChat(widget.room.id, userMessageText);")
content = content.replace("final allAgentsData = await _apiService.getAgents();", "final allAgentsData = await ApiService.getAgents();")
content = content.replace("await _apiService.addAgentToRoom(widget.room.id, agent.id);", "await ApiService.addAgentToRoom(widget.room.id, agent.id);")
content = content.replace("text: msg.content", "text: msg.text")
content = content.replace("child: Text(msg.content)", "child: Text(msg.text)")
content = content.replace("return ChatBubble(", "return ChatBubble(\n                              text: msg.text,")

with open("frontend/lib/group_chat_page.dart", "w") as f:
    f.write(content)

with open("frontend/lib/agents_page.dart", "r") as f:
    content = f.read()

content = content.replace("final data = await _apiService.getAgents();", "final data = await ApiService.getAgents();")
content = content.replace("await _apiService.createAgent(nameController.text, personalityController.text);", "await ApiService.createAgent(nameController.text, personalityController.text);")

with open("frontend/lib/agents_page.dart", "w") as f:
    f.write(content)

with open("frontend/lib/rooms_page.dart", "r") as f:
    content = f.read()

content = content.replace("final data = await _apiService.getRooms();", "final data = await ApiService.getRooms();")
content = content.replace("await _apiService.createRoom(nameController.text);", "await ApiService.createRoom(nameController.text);")

with open("frontend/lib/rooms_page.dart", "w") as f:
    f.write(content)
