class Capability {
  final String id;
  final String name;
  final String description;
  final String icon;

  Capability({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
  });

  factory Capability.fromJson(Map<String, dynamic> json) {
    return Capability(
      id: json['id'].toString(),
      name: json['name'].toString(),
      description: json['description'].toString(),
      icon: json['icon'].toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'icon': icon,
    };
  }
}

class Integration {
  final String type;
  final String displayName;
  final String description;
  final String icon;
  final String status;

  Integration({
    required this.type,
    required this.displayName,
    required this.description,
    required this.icon,
    required this.status,
  });

  factory Integration.fromJson(Map<String, dynamic> json) {
    return Integration(
      type: json['type'].toString(),
      displayName: json['display_name'].toString(),
      description: json['description'].toString(),
      icon: json['icon'].toString(),
      status: json['status'].toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'display_name': displayName,
      'description': description,
      'icon': icon,
      'status': status,
    };
  }
}

class AgentGenerationResponse {
  final String name;
  final String personality;
  final String description;
  final List<String> goals;
  final List<String> capabilities;
  final List<String> suggestedIntegrations;

  AgentGenerationResponse({
    required this.name,
    required this.personality,
    required this.description,
    required this.goals,
    required this.capabilities,
    required this.suggestedIntegrations,
  });

  factory AgentGenerationResponse.fromJson(Map<String, dynamic> json) {
    return AgentGenerationResponse(
      name: json['name'].toString(),
      personality: json['personality'].toString(),
      description: json['description'].toString(),
      goals: (json['goals'] as List<dynamic>? ?? [])
          .map((e) => e.toString())
          .toList(),
      capabilities: (json['capabilities'] as List<dynamic>? ?? [])
          .map((e) => e.toString())
          .toList(),
      suggestedIntegrations:
          (json['suggested_integrations'] as List<dynamic>? ?? [])
              .map((e) => e.toString())
              .toList(),
    );
  }
}
