class Agent {
  final String id;
  final String name;
  final String personality;
  final String? description;
  final List<String> goals;
  final List<String> capabilities;
  final List<String> integrations;
  final String? systemPrompt;
  final String status;
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
    required this.createdAt,
  });

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
      'created_at': createdAt,
    };
  }
}
