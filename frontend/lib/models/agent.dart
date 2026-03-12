import 'package:flutter/widgets.dart';

class Agent {
  static const List<String> _fallbackAvatarAssets = <String>[
    'assets/images/corp_ai_avatar_3.png',
    'assets/images/corp_ai_avatar_4.png',
    'assets/images/corp_ai_avatar_5_1773260876684.png',
  ];

  final String id;
  final String name;
  final String personality;
  final String? description;
  final List<String> goals;
  final List<String> capabilities;
  final List<String> integrations;
  final String? systemPrompt;
  final String status;
  final String mood;
  final int messageCount;
  final String? avatarUrl;
  final String createdAt;

  Agent({
    required this.id,
    required this.name,
    required this.personality,
    this.description,
    this.goals = const <String>[],
    this.capabilities = const <String>[],
    this.integrations = const <String>[],
    this.systemPrompt,
    this.status = 'active',
    this.mood = 'Neutral',
    this.messageCount = 0,
    this.avatarUrl,
    required this.createdAt,
  });

  ImageProvider get avatarImage {
    if (avatarUrl != null && avatarUrl!.isNotEmpty) {
      return NetworkImage(avatarUrl!);
    }
    final int seed = id.hashCode.abs() % _fallbackAvatarAssets.length;
    return AssetImage(_fallbackAvatarAssets[seed]);
  }

  int get connectionLevel => (messageCount / 10).floor() + 1;

  factory Agent.fromJson(Map<String, dynamic> json) {
    return Agent(
      id: json['id'].toString(),
      name: json['name'].toString(),
      personality: json['personality'].toString(),
      description: json['description'] as String?,
      goals: (json['goals'] as List<dynamic>? ?? [])
          .map((dynamic e) => e.toString())
          .toList(),
      capabilities: (json['capabilities'] as List<dynamic>? ?? [])
          .map((dynamic e) => e.toString())
          .toList(),
      integrations: (json['integrations'] as List<dynamic>? ?? [])
          .map((dynamic e) => e.toString())
          .toList(),
      systemPrompt: json['system_prompt'] as String?,
      status: (json['status'] as String?) ?? 'active',
      mood: (json['mood'] as String?) ?? 'Neutral',
      messageCount: (json['message_count'] as num?)?.toInt() ?? 0,
      avatarUrl: json['avatar_url'] as String?,
      createdAt: json['created_at'].toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'personality': personality,
      'description': description,
      'goals': goals,
      'capabilities': capabilities,
      'integrations': integrations,
      'system_prompt': systemPrompt,
      'status': status,
      'mood': mood,
      'message_count': messageCount,
      'avatar_url': avatarUrl,
      'created_at': createdAt,
    };
  }
}
