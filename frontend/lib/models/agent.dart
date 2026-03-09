class Agent {
  final String id;
  final String name;
  final String personality;
  final String createdAt;

  Agent({
    required this.id,
    required this.name,
    required this.personality,
    required this.createdAt,
  });

  factory Agent.fromJson(Map<String, dynamic> json) {
    return Agent(
      id: json['id'],
      name: json['name'],
      personality: json['personality'],
      createdAt: json['created_at'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'personality': personality,
      'created_at': createdAt,
    };
  }
}
