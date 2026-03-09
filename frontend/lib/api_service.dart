import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'backend_service.dart';

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

  /// Streams a chat response from the backend.
  static Stream<String> sendMessage(String message) async* {
    final uri = Uri.parse('$_baseUrl/chat');

    final client = http.Client();
    try {
      final request = http.Request('POST', uri)
        ..headers['Content-Type'] = 'application/json; charset=utf-8'
        ..body = jsonEncode(<String, dynamic>{
          'message': message,
          'use_crew': false,
        });

      final streamedResponse = await client.send(request);

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
      headers: {'Content-Type': 'application/json; charset=utf-8'},
      body: jsonEncode(<String, dynamic>{'message': message}),
    );

    if (response.statusCode != 200) {
      throw Exception('Server error: ${response.statusCode}');
    }

    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return CrewResult.fromJson(json);
  }
}
