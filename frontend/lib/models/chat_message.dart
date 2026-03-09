class ChatMessage {
  final String id;
  final String roomId;
  final String? userId;
  final String? agentId;
  final String content;
  final String createdAt;

  ChatMessage({
    required this.id,
    required this.roomId,
    this.userId,
    this.agentId,
    required this.content,
    required this.createdAt,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'],
      roomId: json['room_id'],
      userId: json['user_id'],
      agentId: json['agent_id'],
      content: json['content'],
      createdAt: json['created_at'],
    );
  }

  bool get isUser => userId != null;
  bool get isAgent => agentId != null;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'room_id': roomId,
      'user_id': userId,
      'agent_id': agentId,
      'content': content,
      'created_at': createdAt,
    };
  }
}
