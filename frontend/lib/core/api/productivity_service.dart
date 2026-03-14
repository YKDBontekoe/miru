import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/note.dart';
import '../models/task.dart';
import '../services/supabase_service.dart';
import 'backend_service.dart';

class ProductivityService {
  final http.Client _client;

  ProductivityService({http.Client? client})
      : _client = client ?? http.Client();

  String get _normalizedBaseUrl {
    final raw = BackendService.baseUrl.value;
    return raw.endsWith('/') ? raw.substring(0, raw.length - 1) : raw;
  }

  Future<Map<String, String>> _headers() async {
    final token = SupabaseService.accessToken;
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // ---------------------------------------------------------------------------
  // Tasks
  // ---------------------------------------------------------------------------

  Future<List<Task>> listTasks() async {
    final uri = Uri.parse('$_normalizedBaseUrl/productivity/tasks');
    final response = await _client.get(uri, headers: await _headers());

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body) as List<dynamic>;
      return data
          .map((json) => Task.fromJson(json as Map<String, dynamic>))
          .toList();
    } else {
      throw Exception('Failed to load tasks: ${response.statusCode}');
    }
  }

  Future<Task> createTask(String title, {String? description}) async {
    final uri = Uri.parse('$_normalizedBaseUrl/productivity/tasks');
    final response = await _client.post(
      uri,
      headers: await _headers(),
      body: jsonEncode({
        'title': title,
        if (description != null) 'description': description,
      }),
    );

    if (response.statusCode == 201) {
      return Task.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
    } else {
      throw Exception('Failed to create task: ${response.statusCode}');
    }
  }

  Future<Task> updateTask(String id,
      {String? title, String? description, bool? isCompleted}) async {
    final uri = Uri.parse('$_normalizedBaseUrl/productivity/tasks/$id');
    final Map<String, dynamic> updates = {};
    if (title != null) updates['title'] = title;
    if (description != null) updates['description'] = description;
    if (isCompleted != null) updates['is_completed'] = isCompleted;

    final response = await _client.patch(
      uri,
      headers: await _headers(),
      body: jsonEncode(updates),
    );

    if (response.statusCode == 200) {
      return Task.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
    } else {
      throw Exception('Failed to update task: ${response.statusCode}');
    }
  }

  Future<void> deleteTask(String id) async {
    final uri = Uri.parse('$_normalizedBaseUrl/productivity/tasks/$id');
    final response = await _client.delete(uri, headers: await _headers());

    if (response.statusCode != 204) {
      throw Exception('Failed to delete task: ${response.statusCode}');
    }
  }

  // ---------------------------------------------------------------------------
  // Notes
  // ---------------------------------------------------------------------------

  Future<List<Note>> listNotes() async {
    final uri = Uri.parse('$_normalizedBaseUrl/productivity/notes');
    final response = await _client.get(uri, headers: await _headers());

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body) as List<dynamic>;
      return data
          .map((json) => Note.fromJson(json as Map<String, dynamic>))
          .toList();
    } else {
      throw Exception('Failed to load notes: ${response.statusCode}');
    }
  }

  Future<Note> createNote(String title, String content,
      {bool isPinned = false}) async {
    final uri = Uri.parse('$_normalizedBaseUrl/productivity/notes');
    final response = await _client.post(
      uri,
      headers: await _headers(),
      body: jsonEncode({
        'title': title,
        'content': content,
        'is_pinned': isPinned,
      }),
    );

    if (response.statusCode == 201) {
      return Note.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
    } else {
      throw Exception('Failed to create note: ${response.statusCode}');
    }
  }

  Future<Note> updateNote(String id,
      {String? title, String? content, bool? isPinned}) async {
    final uri = Uri.parse('$_normalizedBaseUrl/productivity/notes/$id');
    final Map<String, dynamic> updates = {};
    if (title != null) updates['title'] = title;
    if (content != null) updates['content'] = content;
    if (isPinned != null) updates['is_pinned'] = isPinned;

    final response = await _client.patch(
      uri,
      headers: await _headers(),
      body: jsonEncode(updates),
    );

    if (response.statusCode == 200) {
      return Note.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
    } else {
      throw Exception('Failed to update note: ${response.statusCode}');
    }
  }

  Future<void> deleteNote(String id) async {
    final uri = Uri.parse('$_normalizedBaseUrl/productivity/notes/$id');
    final response = await _client.delete(uri, headers: await _headers());

    if (response.statusCode != 204) {
      throw Exception('Failed to delete note: ${response.statusCode}');
    }
  }
}
