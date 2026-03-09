import "dart:convert";
import "message_status.dart";
class ChatMessage {
  final MessageStatus status;

  final String id;
  final String roomId;
  final String? userId;
  final String? agentId;
  final String text;
  final String createdAt;

  ChatMessage({
    required this.id,
    required this.roomId,
    this.userId,
    this.agentId,
    this.status = MessageStatus.sent,
    required this.text,
    required this.createdAt,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'].toString(),
      roomId: json['room_id'].toString(),
      userId: json['user_id']?.toString(),
      agentId: json['agent_id']?.toString(),
      text: json['content'].toString(),
      createdAt: json['created_at'].toString(),
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
      'content': text,
      'created_at': createdAt,
    };
  }


  // Added copyWith
  ChatMessage copyWith({
    String? id,
    String? roomId,
    String? userId,
    String? agentId,
    MessageStatus? status,
    String? text,
    String? createdAt,
    String? crewTaskType,
  }) {
    return ChatMessage(
      id: id ?? this.id,
      roomId: roomId ?? this.roomId,
      userId: userId ?? this.userId,
      agentId: agentId ?? this.agentId,
      status: status ?? this.status,
      text: text ?? this.text,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  // List encoding/decoding
  static String encodeList(List<ChatMessage> messages) {
    return jsonEncode(messages.map((m) => m.toJson()).toList());
  }

  static List<ChatMessage> decodeList(String jsonString) {
    final List<dynamic> decoded = jsonDecode(jsonString) as List<dynamic>;
    return decoded.map((item) => ChatMessage.fromJson(item as Map<String, dynamic>)).toList();
  }

  // Placeholder factories
  static ChatMessage user(String text) {
    return ChatMessage(
      id: DateTime.now().toIso8601String(),
      roomId: 'temp',
      userId: 'temp',
      text: text,
      createdAt: DateTime.now().toIso8601String(),
      status: MessageStatus.sending,
    );
  }

  static ChatMessage assistantPlaceholder() {
    return ChatMessage(
      id: DateTime.now().toIso8601String(),
      roomId: 'temp',
      agentId: 'temp',
      text: '',
      createdAt: DateTime.now().toIso8601String(),
      status: MessageStatus.streaming,
    );
  }

  // added to fix flutter run errors
  String? get crewTaskType => null;
}
