import 'package:freezed_annotation/freezed_annotation.dart';

part 'memory.freezed.dart';
part 'memory.g.dart';

@freezed
@JsonSerializable(fieldRename: FieldRename.snake)
class Memory with _$Memory {
  const factory Memory({
    required String id,
    required String content,
    required String createdAt,
  }) = _Memory;

  factory Memory.fromJson(Map<String, dynamic> json) => _$MemoryFromJson(json);
}

@freezed
class MemoryGraph with _$MemoryGraph {
  const factory MemoryGraph({
    @Default(<Memory>[]) List<Memory> nodes,
    @Default(<MemoryEdge>[]) List<MemoryEdge> edges,
  }) = _MemoryGraph;

  factory MemoryGraph.fromJson(Map<String, dynamic> json) =>
      _$MemoryGraphFromJson(json);
}

@freezed
class MemoryEdge with _$MemoryEdge {
  const factory MemoryEdge({
    required String source,
    required String target,
    String? type,
  }) = _MemoryEdge;

  factory MemoryEdge.fromJson(Map<String, dynamic> json) {
    return MemoryEdge(
      source: (json['source'] ?? json['from'] ?? '').toString(),
      target: (json['target'] ?? json['to'] ?? '').toString(),
      type: json['type']?.toString() ?? json['relationship_type']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'source': source,
        'target': target,
        if (type != null) 'type': type,
      };
}
