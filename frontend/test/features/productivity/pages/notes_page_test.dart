import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:miru/features/productivity/pages/notes_page.dart';
import 'package:miru/features/productivity/pages/tasks_page.dart'; // for productivityServiceProvider
import 'package:miru/core/design_system/theme/app_theme_data.dart';
import 'package:miru/core/models/note.dart';
import 'package:miru/core/api/productivity_service.dart';
import 'package:miru/features/productivity/models/calendar_event.dart';
import 'package:miru/core/models/task.dart';
import 'package:miru/core/api/agents_service.dart';

class MockProductivityService implements ProductivityService {
  @override
  Future<List<Task>> listTasks() async => [];
  @override
  Future<Task> createTask(String title, {String? description}) async =>
      throw UnimplementedError();
  @override
  Future<Task> updateTask(
    String id, {
    String? title,
    String? description,
    bool? isCompleted,
  }) async => throw UnimplementedError();
  @override
  Future<void> deleteTask(String id) async => throw UnimplementedError();
  @override
  Future<List<Note>> listNotes() async => [
    Note(
      id: '1',
      title: 'Test Note',
      content: 'Test Content',
      userId: 'u1',
      isPinned: false,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    ),
  ];
  @override
  Future<Note> createNote(
    String title,
    String content, {
    String? agentId,
    String? originContext,
    String? originRoomId,
    String? originMessageId,
    bool isPinned = false,
  }) async => throw UnimplementedError();
  @override
  Future<Note> updateNote(
    String id, {
    String? title,
    String? content,
    bool? isPinned,
  }) async => throw UnimplementedError();
  @override
  Future<void> deleteNote(String id) async => throw UnimplementedError();
  @override
  Future<List<CalendarEvent>> listCalendarEvents({
    int limit = 50,
    int offset = 0,
  }) async => [];
  @override
  Future<CalendarEvent> createCalendarEvent(CalendarEventCreate data) async =>
      throw UnimplementedError();
  @override
  Future<CalendarEvent> updateCalendarEvent(
    String id,
    CalendarEventUpdate data,
  ) async => throw UnimplementedError();
  @override
  Future<void> deleteCalendarEvent(String id) async =>
      throw UnimplementedError();
}

void main() {
  testWidgets('NotesPage renders notes correctly', (tester) async {
    final mockService = MockProductivityService();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          productivityServiceProvider.overrideWithValue(mockService),
          agentsProvider.overrideWith((ref) => Future.value([])),
        ],
        child: MaterialApp(
          theme: AppTheme.light,
          home: const Scaffold(body: NotesPage()),
        ),
      ),
    );

    // Initial loading state
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    await tester.pumpAndSettle();

    expect(find.text('Test Note'), findsOneWidget);
    expect(find.text('Test Content'), findsOneWidget);
    expect(find.byIcon(Icons.edit), findsOneWidget);
    expect(find.byIcon(Icons.delete), findsOneWidget);
  });
}
