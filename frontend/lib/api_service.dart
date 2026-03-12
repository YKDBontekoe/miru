import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import 'backend_service.dart';
import 'models/agent.dart';
import 'models/agent_info.dart';
import 'models/chat_message.dart';
import 'models/chat_room.dart';
import 'models/memory.dart';
import 'services/supabase_service.dart';

/// Result returned by [ApiService.runCrew].
class CrewResult {
  final String taskType;
  final String result;

  const CrewResult({required this.taskType, required this.result});

  factory CrewResult.fromJson(Map<String, dynamic> json) => CrewResult(
        taskType: json['task_type'] as String? ?? 'general',
        result: json['result'] as String? ?? '',
      );
}

class ApiService {
  static String get baseUrl => BackendService.baseUrl.value;

  /// Common headers for all authenticated requests.
  static Map<String, String> get _headers {
    final token = SupabaseService.accessToken;
    return {
      'Content-Type': 'application/json; charset=utf-8',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  /// Streams a chat response from the backend.
  static Stream<String> sendMessage(String message) async* {
    final uri = Uri.parse('$baseUrl/chat');

    final client = http.Client();
    try {
      final request = http.Request('POST', uri)
        ..headers.addAll(_headers)
        ..body = jsonEncode(<String, dynamic>{
          'message': message,
          'use_crew': false,
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

  // --- Memories API ---

  static Future<List<Memory>> getMemories() async {
    final response = await http.get(
      Uri.parse('$baseUrl/memories'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      final Map<String, dynamic> data =
          jsonDecode(response.body) as Map<String, dynamic>;
      final List<dynamic> memories = data['memories'] as List<dynamic>;
      return memories
          .map((e) => Memory.fromJson(e as Map<String, dynamic>))
          .toList();
    } else {
      throw Exception('Failed to load memories: ${response.statusCode}');
    }
  }

  static Future<void> deleteMemory(String id) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/memories/$id'),
      headers: _headers,
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to delete memory: ${response.statusCode}');
    }
  }

  static Future<MemoryGraph> getMemoryGraph() async {
    final response = await http.get(
      Uri.parse('$baseUrl/memories/graph'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final Map<String, dynamic> data =
          jsonDecode(response.body) as Map<String, dynamic>;
      return MemoryGraph.fromJson(data);
    }

    throw Exception('Failed to load memory graph: ${response.statusCode}');
  }

  /// Runs a CrewAI crew for [message] and returns the full structured result.
  static Future<CrewResult> runCrew(String message) async {
    final uri = Uri.parse('$baseUrl/crew');

    final response = await http.post(
      uri,
      headers: _headers,
      body: jsonEncode(<String, dynamic>{'message': message}),
    );

    if (response.statusCode == 401) {
      throw const ApiAuthException('Session expired. Please sign in again.');
    }

    if (response.statusCode != 200) {
      throw Exception('Server error: ${response.statusCode}');
    }

    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return CrewResult.fromJson(json);
  }

  // --- Agents API ---

  static Future<List<Agent>> getAgents() async {
    final response = await http.get(
      Uri.parse('$baseUrl/agents'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body) as List<dynamic>;
      return data
          .map((e) => Agent.fromJson(e as Map<String, dynamic>))
          .toList();
    } else {
      throw Exception('Failed to load agents: ${response.statusCode}');
    }
  }

  static Future<Agent> createAgent(
    String name,
    String personality, {
    String? description,
    List<String> goals = const <String>[],
    List<String> capabilities = const <String>[],
    List<String> integrations = const <String>[],
    String? systemPrompt,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/agents'),
      headers: _headers,
      body: jsonEncode({
        'name': name,
        'personality': personality,
        'description': description,
        'goals': goals,
        'capabilities': capabilities,
        'integrations': integrations,
        'system_prompt': systemPrompt,
      }),
    );
    if (response.statusCode == 200 || response.statusCode == 201) {
      return Agent.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
    } else {
      throw Exception('Failed to create agent: ${response.statusCode}');
    }
  }

  static Future<AgentGenerationResponse> generateAgent(String keywords) async {
    final response = await http.post(
      Uri.parse('$baseUrl/agents/generate'),
      headers: _headers,
      body: jsonEncode({'keywords': keywords}),
    );
    if (response.statusCode == 200) {
      return AgentGenerationResponse.fromJson(
          jsonDecode(response.body) as Map<String, dynamic>);
    } else {
      throw Exception('Failed to generate agent: ${response.statusCode}');
    }
  }

  static Future<List<Capability>> getAgentCapabilities() async {
    final response = await http.get(
      Uri.parse('$baseUrl/agents/capabilities'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body) as List<dynamic>;
      return data
          .map((dynamic e) => Capability.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    throw Exception('Failed to load capabilities: ${response.statusCode}');
  }

  static Future<List<Integration>> getAgentIntegrations() async {
    final response = await http.get(
      Uri.parse('$baseUrl/agents/integrations'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body) as List<dynamic>;
      return data
          .map((dynamic e) => Integration.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    throw Exception('Failed to load integrations: ${response.statusCode}');
  }

  // --- Chat Rooms API ---

  static Future<List<ChatRoom>> getRooms() async {
    final response = await http.get(
      Uri.parse('$baseUrl/rooms'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body) as List<dynamic>;
      return data
          .map((e) => ChatRoom.fromJson(e as Map<String, dynamic>))
          .toList();
    } else {
      throw Exception('Failed to load rooms: ${response.statusCode}');
    }
  }

  static Future<ChatRoom> createRoom(String name) async {
    final response = await http.post(
      Uri.parse('$baseUrl/rooms'),
      headers: _headers,
      body: jsonEncode({'name': name}),
    );
    if (response.statusCode == 200 || response.statusCode == 201) {
      return ChatRoom.fromJson(
          jsonDecode(response.body) as Map<String, dynamic>);
    } else {
      throw Exception('Failed to create room: ${response.statusCode}');
    }
  }

  static Future<void> updateRoom(String roomId, String name) async {
    final response = await http.patch(
      Uri.parse('$baseUrl/rooms/$roomId'),
      headers: _headers,
      body: jsonEncode({'name': name}),
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to update room: ${response.statusCode}');
    }
  }

  static Future<void> addAgentToRoom(String roomId, String agentId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/rooms/$roomId/agents'),
      headers: _headers,
      body: jsonEncode({'agent_id': agentId}),
    );
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw Exception('Failed to add agent to room: ${response.statusCode}');
    }
  }

  static Future<List<Agent>> getRoomAgents(String roomId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/rooms/$roomId/agents'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body) as List<dynamic>;
      return data
          .map((e) => Agent.fromJson(e as Map<String, dynamic>))
          .toList();
    } else {
      throw Exception('Failed to load room agents: ${response.statusCode}');
    }
  }

  static Future<List<ChatMessage>> getRoomMessages(
    String roomId,
  ) async {
    final response = await http.get(
      Uri.parse('$baseUrl/rooms/$roomId/messages'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body) as List<dynamic>;
      return data
          .map((e) => ChatMessage.fromJson(e as Map<String, dynamic>))
          .toList();
    } else {
      throw Exception('Failed to load room messages: ${response.statusCode}');
    }
  }

  static Stream<String> streamRoomChat(String roomId, String message) async* {
    final uri = Uri.parse('$baseUrl/rooms/$roomId/chat');

    final client = http.Client();
    try {
      final request = http.Request('POST', uri)
        ..headers.addAll(_headers)
        ..body = jsonEncode(<String, dynamic>{'content': message});

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

class ApiAuthException implements Exception {
  final String message;
  const ApiAuthException(this.message);

  @override
  String toString() => 'ApiAuthException: $message';
}
