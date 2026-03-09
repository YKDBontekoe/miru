import re

with open("frontend/lib/api_service.dart", "r") as f:
    content = f.read()

# Make all the new functions static methods in the ApiService class
content = content.replace("class ApiAuthException", """
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
    final request = http.Request(
      'POST',
      Uri.parse('$baseUrl/api/rooms/$roomId/chat'),
    );

    request.headers.addAll(_headers);

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
