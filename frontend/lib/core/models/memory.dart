import 'package:freezed_annotation/freezed_annotation.dart';

part 'memory.freezed.dart';
part 'memory.g.dart';

@freezed
class Memory with _$Memory {
  @JsonSerializable(fieldRename: FieldRename.snake)
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

class MemoryEdge {
  final String source;
  final String target;
  final String? type;

  const MemoryEdge({
    required this.source,
    required this.target,
    this.type,
  });

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
