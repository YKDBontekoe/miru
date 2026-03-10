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
      id: json['id'].toString(),
      name: json['name'].toString(),
      personality: json['personality'].toString(),
      createdAt: json['created_at'].toString(),
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
