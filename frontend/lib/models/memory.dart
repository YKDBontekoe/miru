class Memory {
  final String id;
  final String content;
  final String createdAt;

  Memory({
    required this.id,
    required this.content,
    required this.createdAt,
  });

  factory Memory.fromJson(Map<String, dynamic> json) {
    return Memory(
      id: json['id'].toString(),
      content: json['content'].toString(),
      createdAt: json['created_at'].toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'content': content,
      'created_at': createdAt,
    };
  }
}

class MemoryGraph {
  final List<Memory> nodes;
  final List<MemoryEdge> edges;

  MemoryGraph({required this.nodes, required this.edges});

  factory MemoryGraph.fromJson(Map<String, dynamic> json) {
    final nodesRaw = json['nodes'] as List<dynamic>? ?? [];
    final edgesRaw = json['edges'] as List<dynamic>? ?? [];

    return MemoryGraph(
      nodes: nodesRaw
          .map((e) => Memory.fromJson(e as Map<String, dynamic>))
          .toList(),
      edges: edgesRaw
          .map((e) => MemoryEdge.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class MemoryEdge {
  final String source;
  final String target;
  final String? type;

  MemoryEdge({required this.source, required this.target, this.type});

  factory MemoryEdge.fromJson(Map<String, dynamic> json) {
    return MemoryEdge(
      source: (json['source'] ?? json['from'] ?? '').toString(),
      target: (json['target'] ?? json['to'] ?? '').toString(),
      type: json['type']?.toString() ?? json['relationship_type']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'source': source,
      'target': target,
      'type': type,
    };
  }
}
