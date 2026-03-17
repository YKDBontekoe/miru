import 'package:flutter/foundation.dart';
import 'dart:async';
import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:miru/core/api/backend_service.dart';
import 'package:miru/core/models/agent.dart';
import 'package:miru/core/models/agent_info.dart';
import 'package:miru/core/models/chat_message.dart';
import 'package:miru/core/models/chat_room.dart';
import 'package:miru/core/models/memory.dart';
import 'package:miru/core/services/supabase_service.dart';

/// Result returned by [ApiService.instance.runCrew].
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
  static ApiService? _instance;
  static ApiService get instance => _instance ?? ApiService();
  @visibleForTesting
  static set instance(ApiService? mock) => _instance = mock;
  static String get baseUrl => BackendService.baseUrl.value;

  static Dio _getDio() {
    // Note: ensure baseUrl ends with a slash so that relative paths
    // (without leading slash) work correctly.
    final effectiveBaseUrl = baseUrl.endsWith('/') ? baseUrl : '$baseUrl/';

    final dio = Dio(
      BaseOptions(
        baseUrl: effectiveBaseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        contentType: 'application/json; charset=utf-8',
      ),
    );

    final token = SupabaseService.accessToken;
    if (token != null) {
      dio.options.headers['Authorization'] = 'Bearer $token';
    }

    return dio;
  }

  Future<T> _handleError<T>(Future<T> Function(Dio dio) call) async {
    try {
      return await call(_getDio());
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw const ApiAuthException('Session expired. Please sign in again.');
      }
      final errorBody = e.response?.data?.toString() ?? e.message;
      throw Exception('API Error (${e.response?.statusCode}): $errorBody');
    }
  }

  /// Streams a chat response from the backend.
  Stream<String> sendMessage(String message) async* {
    try {
      final dio = _getDio();
      final response = await dio.post<ResponseBody>(
        'chat', // No leading slash
        data: {'message': message, 'use_crew': false},
        options: Options(responseType: ResponseType.stream),
      );

      if (response.data != null) {
        await for (final chunk in response.data!.stream.map(
          (bytes) => utf8.decode(bytes),
        )) {
          yield chunk;
        }
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw const ApiAuthException('Session expired. Please sign in again.');
      }
      rethrow;
    }
  }

  // --- Memories API ---

  Future<List<Memory>> getMemories() async {
    return _handleError((dio) async {
      final response = await dio.get('memory');
      final data = response.data as Map<String, dynamic>;
      final memories = data['memories'] as List<dynamic>;
      return memories
          .map((e) => Memory.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  Future<void> deleteMemory(String id) async {
    await _handleError((dio) => dio.delete('memory/$id'));
  }

  Future<MemoryGraph> getMemoryGraph() async {
    return _handleError((dio) async {
      final response = await dio.get('memory/graph');
      return MemoryGraph.fromJson(response.data as Map<String, dynamic>);
    });
  }

  /// Runs a CrewAI crew for [message] and returns the full structured result.
  Future<CrewResult> runCrew(String message) async {
    return _handleError((dio) async {
      final response = await dio.post('crew', data: {'message': message});
      return CrewResult.fromJson(response.data as Map<String, dynamic>);
    });
  }

  // --- Agents API ---

  Future<List<Agent>> getAgents() async {
    return _handleError((dio) async {
      final response = await dio.get('agents');
      final data = response.data as List<dynamic>;
      return data
          .map((e) => Agent.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  Future<Agent> createAgent(
    String name,
    String personality, {
    String? description,
    List<String> goals = const <String>[],
    List<String> capabilities = const <String>[],
    List<String> integrations = const <String>[],
    Map<String, dynamic> integrationConfigs = const <String, dynamic>{},
    String? systemPrompt,
  }) async {
    return _handleError((dio) async {
      final response = await dio.post(
        'agents',
        data: {
          'name': name,
          'personality': personality,
          'description': description,
          'goals': goals,
          'capabilities': capabilities,
          'integrations': integrations,
          'integration_configs': integrationConfigs,
          'system_prompt': systemPrompt,
        },
      );
      return Agent.fromJson(response.data as Map<String, dynamic>);
    });
  }

  Future<Map<String, dynamic>> resolveSteamUser(String username) async {
    return _handleError((dio) async {
      final response = await dio.get(
        'integrations/steam/resolve-user',
        queryParameters: {'username': username},
      );
      return response.data as Map<String, dynamic>;
    });
  }

  Future<AgentGenerationResponse> generateAgent(String keywords) async {
    return _handleError((dio) async {
      final response = await dio.post(
        'agents/generate',
        data: {'keywords': keywords},
      );
      return AgentGenerationResponse.fromJson(
        response.data as Map<String, dynamic>,
      );
    });
  }

  Future<List<Capability>> getAgentCapabilities() async {
    return _handleError((dio) async {
      final response = await dio.get('agents/capabilities');
      final data = response.data as List<dynamic>;
      return data
          .map((dynamic e) => Capability.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  Future<List<Integration>> getAgentIntegrations() async {
    return _handleError((dio) async {
      final response = await dio.get('agents/integrations');
      final data = response.data as List<dynamic>;
      return data
          .map((dynamic e) => Integration.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  // --- Chat Rooms API ---

  /// Get a SignalR connection token.
  Future<Map<String, dynamic>> negotiateSignalR() async {
    final dio = _getDio();
    final response = await dio.post('api/v1/negotiate');
    if (response.statusCode == 200) {
      return response.data as Map<String, dynamic>;
    } else {
      throw Exception('Failed to negotiate SignalR');
    }
  }

  Future<List<ChatRoom>> getRooms() async {
    return _handleError((dio) async {
      final response = await dio.get('rooms');
      final data = response.data as List<dynamic>;
      return data
          .map((e) => ChatRoom.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  Future<ChatRoom> createRoom(String name) async {
    return _handleError((dio) async {
      final response = await dio.post('rooms', data: {'name': name});
      return ChatRoom.fromJson(response.data as Map<String, dynamic>);
    });
  }

  Future<void> updateRoom(String roomId, String name) async {
    await _handleError(
      (dio) => dio.patch('rooms/$roomId', data: {'name': name}),
    );
  }

  Future<void> addAgentToRoom(String roomId, String agentId) async {
    await _handleError(
      (dio) => dio.post('rooms/$roomId/agents', data: {'agent_id': agentId}),
    );
  }

  Future<List<Agent>> getRoomAgents(String roomId) async {
    return _handleError((dio) async {
      final response = await dio.get('rooms/$roomId/agents');
      final data = response.data as List<dynamic>;
      return data
          .map((e) => Agent.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  Future<List<ChatMessage>> getRoomMessages(String roomId) async {
    return _handleError((dio) async {
      final response = await dio.get('rooms/$roomId/messages');
      final data = response.data as List<dynamic>;
      return data
          .map((e) => ChatMessage.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  Stream<String> streamRoomChat(String roomId, String message) async* {
    try {
      final dio = _getDio();
      final response = await dio.post<ResponseBody>(
        'rooms/$roomId/chat',
        data: {'content': message},
        options: Options(responseType: ResponseType.stream),
      );

      if (response.data != null) {
        await for (final chunk in response.data!.stream.map(
          (bytes) => utf8.decode(bytes),
        )) {
          yield chunk;
        }
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw const ApiAuthException('Session expired. Please sign in again.');
      }
      rethrow;
    }
  }
}

class ApiAuthException implements Exception {
  final String message;
  const ApiAuthException(this.message);

  @override
  String toString() => 'ApiAuthException: $message';
}
