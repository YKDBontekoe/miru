import re

with open("frontend/lib/api_service.dart", "r") as f:
    content = f.read()

# Replace global functions with static methods inside ApiService
content = content.replace("Future<List<Map<String, dynamic>>> getAgents()", "static Future<List<Map<String, dynamic>>> getAgents()")
content = content.replace("Future<Map<String, dynamic>> createAgent(", "static Future<Map<String, dynamic>> createAgent(")
content = content.replace("Future<List<Map<String, dynamic>>> getRooms()", "static Future<List<Map<String, dynamic>>> getRooms()")
content = content.replace("Future<Map<String, dynamic>> createRoom(", "static Future<Map<String, dynamic>> createRoom(")
content = content.replace("Future<void> addAgentToRoom(", "static Future<void> addAgentToRoom(")
content = content.replace("Future<List<Map<String, dynamic>>> getRoomAgents(", "static Future<List<Map<String, dynamic>>> getRoomAgents(")
content = content.replace("Future<List<Map<String, dynamic>>> getRoomMessages(", "static Future<List<Map<String, dynamic>>> getRoomMessages(")
content = content.replace("Stream<String> streamRoomChat(", "static Stream<String> streamRoomChat(")

# Replace 'client.get' and 'client.post' with 'http.get' and 'http.post' and add _headers
content = content.replace("client.get(Uri.parse('$baseUrl/api/agents'))", "http.get(Uri.parse('$baseUrl/api/agents'), headers: _headers)")
content = content.replace("client.post(\n    Uri.parse('$baseUrl/api/agents'),", "http.post(\n    Uri.parse('$baseUrl/api/agents'), headers: _headers,")
content = content.replace("client.get(Uri.parse('$baseUrl/api/rooms'))", "http.get(Uri.parse('$baseUrl/api/rooms'), headers: _headers)")
content = content.replace("client.post(\n    Uri.parse('$baseUrl/api/rooms'),", "http.post(\n    Uri.parse('$baseUrl/api/rooms'), headers: _headers,")
content = content.replace("client.post(\n    Uri.parse('$baseUrl/api/rooms/$roomId/agents'),", "http.post(\n    Uri.parse('$baseUrl/api/rooms/$roomId/agents'), headers: _headers,")
content = content.replace("client.get(\n    Uri.parse('$baseUrl/api/rooms/$roomId/agents'),", "http.get(\n    Uri.parse('$baseUrl/api/rooms/$roomId/agents'), headers: _headers,")
content = content.replace("client.get(\n    Uri.parse('$baseUrl/api/rooms/$roomId/messages'),", "http.get(\n    Uri.parse('$baseUrl/api/rooms/$roomId/messages'), headers: _headers,")

# Wrap the global functions inside the ApiService class
content = content.replace("class ApiAuthException", """
  // --- Agents API ---

  static Future<List<Map<String, dynamic>>> getAgents() async {
    final response = await http.get(Uri.parse('$baseUrl/api/agents'), headers: _headers);
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return List<Map<String, dynamic>>.from(data);
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
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to create agent: ${response.statusCode}');
    }
  }

  // --- Chat Rooms API ---

  static Future<List<Map<String, dynamic>>> getRooms() async {
    final response = await http.get(Uri.parse('$baseUrl/api/rooms'), headers: _headers);
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return List<Map<String, dynamic>>.from(data);
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
      return jsonDecode(response.body);
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
      return List<Map<String, dynamic>>.from(data);
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
      return List<Map<String, dynamic>>.from(data);
    } else {
      throw Exception('Failed to load room messages: ${response.statusCode}');
    }
  }

  static Stream<String> streamRoomChat(String roomId, String message) async* {
    final request = http.Request(
      'POST',
      Uri.parse('$baseUrl/api/rooms/$roomId/chat'),
    );

    // Add auth header manually since we're using raw http.Request
    final token = Supabase.instance.client.auth.currentSession?.accessToken;
    if (token != null) {
      request.headers['Authorization'] = 'Bearer $token';
    }

    request.headers['Content-Type'] = 'application/json';
    request.body = jsonEncode({'content': message});

    final response = await request.send();

    if (response.statusCode != 200) {
      throw Exception('Failed to connect: ${response.statusCode}');
    }

    await for (final chunk in response.stream.transform(utf8.decoder)) {
      yield chunk;
    }
  }
}

class ApiAuthException""")

# Now remove the old global functions at the end of the file
content = re.sub(r"// --- Agents API ---.*", "", content, flags=re.DOTALL)

with open("frontend/lib/api_service.dart", "w") as f:
    f.write(content)
