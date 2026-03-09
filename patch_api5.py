import re

with open("frontend/lib/api_service.dart", "r") as f:
    content = f.read()

# Fix the class ending properly
content = content.replace("""  factory CrewResult.fromJson(Map<String, dynamic> json) => CrewResult(
    taskType: json['task_type'] as String? ?? 'general',
    result: json['result'] as String? ?? '',
  );

class ApiService {""", """  factory CrewResult.fromJson(Map<String, dynamic> json) => CrewResult(
    taskType: json['task_type'] as String? ?? 'general',
    result: json['result'] as String? ?? '',
  );
}

class ApiService {""")

content = content.replace("class ApiAuthException implements Exception {", """
  // --- Agents API ---

  static Future<List<Map<String, dynamic>>> getAgents() async {
    final response = await http.get(Uri.parse('$baseUrl/api/agents'), headers: _headers);
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((e) => e as Map<String, dynamic>).toList();
    } else {
      throw Exception('Failed to load agents: ${response.statusCode}');
    }
  }

  static Future<Map<String, dynamic>> createAgent(
    String name,
    String personality,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/agents'), headers: _headers,
      body: jsonEncode({'name': name, 'personality': personality}),
    );
    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } else {
      throw Exception('Failed to create agent: ${response.statusCode}');
    }
  }

  // --- Chat Rooms API ---

  static Future<List<Map<String, dynamic>>> getRooms() async {
    final response = await http.get(Uri.parse('$baseUrl/api/rooms'), headers: _headers);
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((e) => e as Map<String, dynamic>).toList();
    } else {
      throw Exception('Failed to load rooms: ${response.statusCode}');
    }
  }

  static Future<Map<String, dynamic>> createRoom(String name) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/rooms'), headers: _headers,
      body: jsonEncode({'name': name}),
    );
    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } else {
      throw Exception('Failed to create room: ${response.statusCode}');
    }
  }

  static Future<void> addAgentToRoom(String roomId, String agentId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/rooms/$roomId/agents'), headers: _headers,
      body: jsonEncode({'agent_id': agentId}),
    );
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw Exception('Failed to add agent to room: ${response.statusCode}');
    }
  }

  static Future<List<Map<String, dynamic>>> getRoomAgents(String roomId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/rooms/$roomId/agents'), headers: _headers,
    );
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((e) => e as Map<String, dynamic>).toList();
    } else {
      throw Exception('Failed to load room agents: ${response.statusCode}');
    }
  }

  static Future<List<Map<String, dynamic>>> getRoomMessages(String roomId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/rooms/$roomId/messages'), headers: _headers,
    );
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((e) => e as Map<String, dynamic>).toList();
    } else {
      throw Exception('Failed to load room messages: ${response.statusCode}');
    }
  }

  static Stream<String> streamRoomChat(String roomId, String message) async* {
    final uri = Uri.parse('$baseUrl/api/rooms/$roomId/chat');

    final client = http.Client();
    try {
      final request = http.Request('POST', uri)
        ..headers.addAll(_headers)
        ..body = jsonEncode(<String, dynamic>{
          'content': message,
        });

      final streamedResponse = await client.send(request);

      if (streamedResponse.statusCode == 401) {
        throw const ApiAuthException('Session expired. Please sign in again.');
      }

      if (streamedResponse.statusCode != 200) {
        final errorBody = await streamedResponse.stream.bytesToString();
        throw Exception(
          'Server error (${streamedResponse.statusCode}): $errorBody',
        );
      }

      await for (final chunk in streamedResponse.stream.transform(
        utf8.decoder,
      )) {
        yield chunk;
      }
    } finally {
      client.close();
    }
  }
}

class ApiAuthException implements Exception {""")

content = content.replace("throw const ApiAuthException", "throw ApiAuthException")
content = re.sub(r"// --- Agents API ---.*", "", content, flags=re.DOTALL)

with open("frontend/lib/api_service.dart", "w") as f:
    f.write(content)
