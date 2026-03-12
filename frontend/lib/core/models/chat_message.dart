import 'dart:convert';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:miru/core/models/message_status.dart';

part 'chat_message.freezed.dart';
part 'chat_message.g.dart';

@freezed
class ChatMessage with _$ChatMessage {
  const ChatMessage._();

  const factory ChatMessage({
    required String id,
    @Default('temp') String roomId,
    String? userId,
    String? agentId,
    required String text,
    required DateTime timestamp,
    @Default(MessageStatus.sent) MessageStatus status,
    String? crewTaskType,
  }) = _ChatMessage;

  bool get isUser => userId != null;
  bool get isAgent => agentId != null;

  factory ChatMessage.user(String text) => ChatMessage(
        id: _generateId(),
        text: text,
        userId: 'temp',
        timestamp: DateTime.now(),
        status: MessageStatus.sent,
      );

  factory ChatMessage.assistantPlaceholder() => ChatMessage(
        id: _generateId(),
        text: '',
        agentId: 'temp',
        timestamp: DateTime.now(),
        status: MessageStatus.streaming,
      );

  factory ChatMessage.fromJson(Map<String, dynamic> json) =>
      _$ChatMessageFromJson(json);

  static String encodeList(List<ChatMessage> messages) {
    return jsonEncode(messages.map((m) => m.toJson()).toList());
  }

  static List<ChatMessage> decodeList(String json) {
    final decoded = jsonDecode(json) as List<dynamic>;
    return decoded
        .map((e) => ChatMessage.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static int _counter = 0;
  static String _generateId() {
    _counter++;
    return '${DateTime.now().millisecondsSinceEpoch}_$_counter';
  }
}
