// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'agent.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$AgentImpl _$$AgentImplFromJson(Map<String, dynamic> json) => _$AgentImpl(
      id: json['id'] as String,
      name: json['name'] as String,
      personality: json['personality'] as String,
      description: json['description'] as String?,
      goals:
          (json['goals'] as List<dynamic>?)?.map((e) => e as String).toList() ??
              const <String>[],
      capabilities: (json['capabilities'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const <String>[],
      integrations: (json['integrations'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const <String>[],
      integrationConfigs:
          json['integration_configs'] as Map<String, dynamic>? ??
              const <String, dynamic>{},
      systemPrompt: json['system_prompt'] as String?,
      status: json['status'] as String? ?? 'active',
      mood: json['mood'] as String? ?? 'Neutral',
      messageCount: (json['message_count'] as num?)?.toInt() ?? 0,
      avatarUrl: json['avatar_url'] as String?,
      createdAt: json['created_at'] as String,
    );

Map<String, dynamic> _$$AgentImplToJson(_$AgentImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'personality': instance.personality,
      'description': instance.description,
      'goals': instance.goals,
      'capabilities': instance.capabilities,
      'integrations': instance.integrations,
      'integration_configs': instance.integrationConfigs,
      'system_prompt': instance.systemPrompt,
      'status': instance.status,
      'mood': instance.mood,
      'message_count': instance.messageCount,
      'avatar_url': instance.avatarUrl,
      'created_at': instance.createdAt,
    };
