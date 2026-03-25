class MemoryCollection {
  final String id;
  final String name;
  final String? description;

  const MemoryCollection({
    required this.id,
    required this.name,
    this.description,
  });

  factory MemoryCollection.fromJson(Map<String, dynamic> json) {
    return MemoryCollection(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Untitled',
      description: json['description']?.toString(),
    );
  }
}

class WorkspaceMemory {
  final String id;
  final String content;
  final String createdAt;
  final String? collectionId;

  const WorkspaceMemory({
    required this.id,
    required this.content,
    required this.createdAt,
    this.collectionId,
  });

  factory WorkspaceMemory.fromJson(Map<String, dynamic> json) {
    return WorkspaceMemory(
      id: json['id']?.toString() ?? '',
      content: json['content']?.toString() ?? '',
      createdAt: json['created_at']?.toString() ?? '',
      collectionId: json['collection_id']?.toString(),
    );
  }
}

class TimelineBucket {
  final String day;
  final List<WorkspaceMemory> memories;

  const TimelineBucket({required this.day, required this.memories});

  factory TimelineBucket.fromJson(Map<String, dynamic> json) {
    final memoriesJson = json['memories'] as List<dynamic>? ?? <dynamic>[];
    return TimelineBucket(
      day: json['day']?.toString() ?? '',
      memories: memoriesJson
          .map(
            (dynamic item) =>
                WorkspaceMemory.fromJson(item as Map<String, dynamic>),
          )
          .toList(),
    );
  }
}
