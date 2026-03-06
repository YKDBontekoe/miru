import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'backend_service.dart';

/// A single OpenRouter model entry returned by [ApiService.fetchModels].
class OpenRouterModel {
  final String id;
  final String name;
  final String description;
  final num? contextLength;
  final Map<String, dynamic> pricing;

  const OpenRouterModel({
    required this.id,
    required this.name,
    required this.description,
    this.contextLength,
    required this.pricing,
  });

  factory OpenRouterModel.fromJson(Map<String, dynamic> json) =>
      OpenRouterModel(
        id: json['id'] as String,
        name: json['name'] as String? ?? json['id'] as String,
        description: json['description'] as String? ?? '',
        contextLength: json['context_length'] as num?,
        pricing: (json['pricing'] as Map<String, dynamic>?) ?? {},
      );

  @override
  String toString() => name;
}

/// Result returned by [ApiService.runCrew].
class CrewResult {
  final String taskType;
  final String result;
  final String? model;

  const CrewResult({required this.taskType, required this.result, this.model});

  factory CrewResult.fromJson(Map<String, dynamic> json) => CrewResult(
        taskType: json['task_type'] as String? ?? 'general',
        result: json['result'] as String? ?? '',
        model: json['model'] as String?,
      );
}

class ApiService {
  static String get _baseUrl => BackendService.baseUrl.value;

  /// Streams a chat response from the backend.
  ///
  /// Pass [model] to override the server default.
  /// Pass [useCrew] to route through CrewAI agents instead of a
  /// single-turn completion.
  static Stream<String> sendMessage(
    String message, {
    String? model,
    bool useCrew = false,
  }) async* {
    final uri = Uri.parse('$_baseUrl/chat');

    final body = <String, dynamic>{'message': message, 'use_crew': useCrew};
    if (model != null) body['model'] = model;

    final client = http.Client();
    try {
      final request = http.Request('POST', uri)
        ..headers['Content-Type'] = 'application/json; charset=utf-8'
        ..body = jsonEncode(body);

      final streamedResponse = await client.send(request);

      if (streamedResponse.statusCode != 200) {
        final errorBody = await streamedResponse.stream.bytesToString();
        throw Exception('Server error (${streamedResponse.statusCode}): $errorBody');
      }

      await for (final chunk in streamedResponse.stream.transform(utf8.decoder)) {
        yield chunk;
      }
    } finally {
      client.close();
    }
  }

  /// Runs a CrewAI crew for [message] and returns the full structured result.
  ///
  /// Unlike [sendMessage], this is non-streaming and waits for the entire
  /// crew to finish before returning.
  static Future<CrewResult> runCrew(String message, {String? model}) async {
    final uri = Uri.parse('$_baseUrl/crew');

    final body = <String, dynamic>{'message': message};
    if (model != null) body['model'] = model;

    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json; charset=utf-8'},
      body: jsonEncode(body),
    );

    if (response.statusCode != 200) {
      throw Exception('Server error: ${response.statusCode}');
    }

    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return CrewResult.fromJson(json);
  }

  /// Fetches the list of models available on OpenRouter.
  ///
  /// Optionally filter by [search] string (matched on model ID and name).
  static Future<List<OpenRouterModel>> fetchModels({String? search}) async {
    final query = (search != null && search.isNotEmpty)
        ? '?search=${Uri.encodeComponent(search)}'
        : '';
    final uri = Uri.parse('$_baseUrl/models$query');

    final response = await http.get(uri);

    if (response.statusCode != 200) {
      throw Exception('Failed to load models: ${response.statusCode}');
    }

    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final list = json['models'] as List<dynamic>;
    return list
        .cast<Map<String, dynamic>>()
        .map(OpenRouterModel.fromJson)
        .toList();
  }
}
