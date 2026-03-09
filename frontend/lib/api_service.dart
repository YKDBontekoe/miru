import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import 'backend_service.dart';
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
  static String get _baseUrl => BackendService.baseUrl.value;

  /// Common headers for all authenticated requests.
  ///
  /// Includes the Supabase JWT as a Bearer token so the backend can validate
  /// the request and scope data to the current user.
  static Map<String, String> get _headers {
    final token = SupabaseService.accessToken;
    return {
      'Content-Type': 'application/json; charset=utf-8',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  /// Streams a chat response from the backend.
  static Stream<String> sendMessage(String message) async* {
    final uri = Uri.parse('$_baseUrl/chat');

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
        throw ApiAuthException('Session expired. Please sign in again.');
      }

      if (streamedResponse.statusCode != 200) {
        final errorBody = await streamedResponse.stream.bytesToString();
        throw Exception(
            'Server error (${streamedResponse.statusCode}): $errorBody');
      }

      await for (final chunk
          in streamedResponse.stream.transform(utf8.decoder)) {
        yield chunk;
      }
    } finally {
      client.close();
    }
  }

  /// Runs a CrewAI crew for [message] and returns the full structured result.
  static Future<CrewResult> runCrew(String message) async {
    final uri = Uri.parse('$_baseUrl/crew');

    final response = await http.post(
      uri,
      headers: _headers,
      body: jsonEncode(<String, dynamic>{'message': message}),
    );

    if (response.statusCode == 401) {
      throw ApiAuthException('Session expired. Please sign in again.');
    }

    if (response.statusCode != 200) {
      throw Exception('Server error: ${response.statusCode}');
    }

    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return CrewResult.fromJson(json);
  }
}

/// Thrown when the backend responds with 401 Unauthorized.
///
/// The UI layer should catch this and redirect to [AuthPage].
class ApiAuthException implements Exception {
  final String message;
  const ApiAuthException(this.message);

  @override
  String toString() => 'ApiAuthException: $message';
}

  // --- Agents API ---

  Future<List<Map<String, dynamic>>> getAgents() async {
    final response = await _client.get(Uri.parse('$_baseUrl/api/agents'));
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return List<Map<String, dynamic>>.from(data);
    } else {
      throw Exception('Failed to load agents: ${response.statusCode}');
    }
  }

  Future<Map<String, dynamic>> createAgent(String name, String personality) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/api/agents'),
      body: jsonEncode({'name': name, 'personality': personality}),
    );
    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to create agent: ${response.statusCode}');
    }
  }

  // --- Chat Rooms API ---

  Future<List<Map<String, dynamic>>> getRooms() async {
    final response = await _client.get(Uri.parse('$_baseUrl/api/rooms'));
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return List<Map<String, dynamic>>.from(data);
    } else {
      throw Exception('Failed to load rooms: ${response.statusCode}');
    }
  }

  Future<Map<String, dynamic>> createRoom(String name) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/api/rooms'),
      body: jsonEncode({'name': name}),
    );
    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to create room: ${response.statusCode}');
    }
  }

  Future<void> addAgentToRoom(String roomId, String agentId) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/api/rooms/$roomId/agents'),
      body: jsonEncode({'agent_id': agentId}),
    );
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw Exception('Failed to add agent to room: ${response.statusCode}');
    }
  }

  Future<List<Map<String, dynamic>>> getRoomAgents(String roomId) async {
    final response = await _client.get(Uri.parse('$_baseUrl/api/rooms/$roomId/agents'));
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return List<Map<String, dynamic>>.from(data);
    } else {
      throw Exception('Failed to load room agents: ${response.statusCode}');
    }
  }

  Future<List<Map<String, dynamic>>> getRoomMessages(String roomId) async {
    final response = await _client.get(Uri.parse('$_baseUrl/api/rooms/$roomId/messages'));
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return List<Map<String, dynamic>>.from(data);
    } else {
      throw Exception('Failed to load room messages: ${response.statusCode}');
    }
  }

  Stream<String> streamRoomChat(String roomId, String message) async* {
    final request = http.Request('POST', Uri.parse('$_baseUrl/api/rooms/$roomId/chat'));

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
