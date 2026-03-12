// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'memory.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$MemoryImpl _$$MemoryImplFromJson(Map<String, dynamic> json) => _$MemoryImpl(
      id: json['id'] as String,
      content: json['content'] as String,
      createdAt: json['created_at'] as String,
    );

Map<String, dynamic> _$$MemoryImplToJson(_$MemoryImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'content': instance.content,
      'created_at': instance.createdAt,
    };

_$MemoryGraphImpl _$$MemoryGraphImplFromJson(Map<String, dynamic> json) =>
    _$MemoryGraphImpl(
      nodes: (json['nodes'] as List<dynamic>?)
              ?.map((e) => Memory.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const <Memory>[],
      edges: (json['edges'] as List<dynamic>?)
              ?.map((e) => MemoryEdge.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const <MemoryEdge>[],
    );

Map<String, dynamic> _$$MemoryGraphImplToJson(_$MemoryGraphImpl instance) =>
    <String, dynamic>{
      'nodes': instance.nodes,
      'edges': instance.edges,
    };
