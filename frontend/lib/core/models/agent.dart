import 'package:flutter/widgets.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'agent.freezed.dart';
part 'agent.g.dart';

@freezed
class Agent with _$Agent {
  const Agent._();

  @JsonSerializable(fieldRename: FieldRename.snake)
  const factory Agent({
    required String id,
    required String name,
    required String personality,
    String? description,
    @Default(<String>[]) List<String> goals,
    @Default(<String>[]) List<String> capabilities,
    @Default(<String>[]) List<String> integrations,
    String? systemPrompt,
    @Default('active') String status,
    @Default('Neutral') String mood,
    @Default(0) int messageCount,
    String? avatarUrl,
    required String createdAt,
  }) = _Agent;

  factory Agent.fromJson(Map<String, dynamic> json) => _$AgentFromJson(json);

  static const List<String> _fallbackAvatarAssets = <String>[
    'assets/images/corp_ai_avatar_3.png',
    'assets/images/corp_ai_avatar_4.png',
    'assets/images/corp_ai_avatar_5_1773260876684.png',
  ];

  ImageProvider get avatarImage {
    if (avatarUrl != null && avatarUrl!.isNotEmpty) {
      return NetworkImage(avatarUrl!);
    }
    final int seed = id.hashCode.abs() % _fallbackAvatarAssets.length;
    return AssetImage(_fallbackAvatarAssets[seed]);
  }

  int get connectionLevel => (messageCount / 10).floor() + 1;
}
