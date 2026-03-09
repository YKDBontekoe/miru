import os

def fix_model(filename):
    with open(filename, "r") as f:
        content = f.read()

    # Cast json fields to String where necessary
    content = content.replace("id: json['id'],", "id: json['id'].toString(),")
    content = content.replace("name: json['name'],", "name: json['name'].toString(),")
    content = content.replace("personality: json['personality'],", "personality: json['personality'].toString(),")
    content = content.replace("createdAt: json['created_at'],", "createdAt: json['created_at'].toString(),")

    content = content.replace("roomId: json['room_id'],", "roomId: json['room_id'].toString(),")
    content = content.replace("userId: json['user_id'],", "userId: json['user_id']?.toString(),")
    content = content.replace("agentId: json['agent_id'],", "agentId: json['agent_id']?.toString(),")
    content = content.replace("text: json['content'],", "text: json['content'].toString(),")

    with open(filename, "w") as f:
        f.write(content)

fix_model("frontend/lib/models/agent.dart")
fix_model("frontend/lib/models/chat_room.dart")
fix_model("frontend/lib/models/chat_message.dart")

with open("frontend/lib/models/chat_message.dart", "r") as f:
    content = f.read()

content = content.replace("final List<dynamic> decoded = jsonDecode(jsonString);", "final List<dynamic> decoded = jsonDecode(jsonString) as List<dynamic>;")
content = content.replace("decoded.map((item) => ChatMessage.fromJson(item)).toList();", "decoded.map((item) => ChatMessage.fromJson(item as Map<String, dynamic>)).toList();")

with open("frontend/lib/models/chat_message.dart", "w") as f:
    f.write(content)
