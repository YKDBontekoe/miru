// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'agent_info.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$CapabilityImpl _$$CapabilityImplFromJson(Map<String, dynamic> json) =>
    _$CapabilityImpl(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      icon: json['icon'] as String,
    );

Map<String, dynamic> _$$CapabilityImplToJson(_$CapabilityImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'description': instance.description,
      'icon': instance.icon,
    };

_$IntegrationImpl _$$IntegrationImplFromJson(Map<String, dynamic> json) =>
    _$IntegrationImpl(
      type: json['type'] as String,
      displayName: json['display_name'] as String,
      description: json['description'] as String,
      icon: json['icon'] as String,
      status: json['status'] as String,
    );

Map<String, dynamic> _$$IntegrationImplToJson(_$IntegrationImpl instance) =>
    <String, dynamic>{
      'type': instance.type,
      'display_name': instance.displayName,
      'description': instance.description,
      'icon': instance.icon,
      'status': instance.status,
    };

_$AgentGenerationResponseImpl _$$AgentGenerationResponseImplFromJson(
        Map<String, dynamic> json) =>
    _$AgentGenerationResponseImpl(
      name: json['name'] as String,
      personality: json['personality'] as String,
      description: json['description'] as String,
      goals: (json['goals'] as List<dynamic>).map((e) => e as String).toList(),
      capabilities: (json['capabilities'] as List<dynamic>)
          .map((e) => e as String)
          .toList(),
      suggestedIntegrations: (json['suggested_integrations'] as List<dynamic>)
          .map((e) => e as String)
          .toList(),
    );

Map<String, dynamic> _$$AgentGenerationResponseImplToJson(
        _$AgentGenerationResponseImpl instance) =>
    <String, dynamic>{
      'name': instance.name,
      'personality': instance.personality,
      'description': instance.description,
      'goals': instance.goals,
      'capabilities': instance.capabilities,
      'suggested_integrations': instance.suggestedIntegrations,
    };
