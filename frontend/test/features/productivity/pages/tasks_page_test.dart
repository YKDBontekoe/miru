import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:miru/features/productivity/pages/tasks_page.dart';
import 'package:miru/core/design_system/theme/app_theme_data.dart';
import 'package:miru/core/models/task.dart';
import 'package:miru/core/api/productivity_service.dart';
import 'package:miru/features/productivity/models/calendar_event.dart';
import 'package:miru/core/models/note.dart';

class MockProductivityService implements ProductivityService {
  Future<List<Task>> Function()? listTasksMock;
  Future<void> Function(String)? deleteTaskMock;
  Future<Task> Function(
    String, {
    String? title,
    String? description,
    bool? isCompleted,
  })?
  updateTaskMock;

  @override
  Future<List<Task>> listTasks() async =>
      listTasksMock?.call() ?? Future.value([]);
  @override
  Future<Task> createTask(String title, {String? description}) async =>
      throw UnimplementedError();
  @override
  Future<Task> updateTask(
    String id, {
    String? title,
    String? description,
    bool? isCompleted,
  }) async {
    if (updateTaskMock != null) {
      return updateTaskMock!(
        id,
        title: title,
        description: description,
        isCompleted: isCompleted,
      );
    }
    throw UnimplementedError();
  }

  @override
  Future<void> deleteTask(String id) async =>
      deleteTaskMock?.call(id) ?? Future.value();
  @override
  Future<List<Note>> listNotes() async => [];
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
  testWidgets('TasksPage renders tasks correctly', (tester) async {
    final mockService = MockProductivityService();
    mockService.listTasksMock = () => Future.value([
      Task(
        id: '1',
        title: 'Test Task',
        description: 'Test Description',
        isCompleted: false,
        userId: 'u1',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
    ]);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [productivityServiceProvider.overrideWithValue(mockService)],
        child: MaterialApp(
          theme: AppTheme.light,
          home: const Scaffold(body: TasksPage()),
        ),
      ),
    );

    // Initial loading state
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    await tester.pumpAndSettle();

    expect(find.text('Test Task'), findsOneWidget);
    expect(find.text('Test Description'), findsOneWidget);
    expect(find.byType(Checkbox), findsOneWidget);
    expect(find.byIcon(Icons.edit), findsOneWidget);
    expect(find.byIcon(Icons.delete), findsOneWidget);
  });

  testWidgets('TasksPage handles empty state', (tester) async {
    final mockService = MockProductivityService();
    mockService.listTasksMock = () => Future.value([]);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [productivityServiceProvider.overrideWithValue(mockService)],
        child: MaterialApp(
          theme: AppTheme.light,
          home: const Scaffold(body: TasksPage()),
        ),
      ),
    );

    await tester.pumpAndSettle();
    expect(find.text('No tasks yet. Add one!'), findsOneWidget);
  });

  testWidgets('TasksPage handles error state', (tester) async {
    final mockService = MockProductivityService();
    mockService.listTasksMock = () => Future.error(Exception('API error'));

    await tester.pumpWidget(
      ProviderScope(
        overrides: [productivityServiceProvider.overrideWithValue(mockService)],
        child: MaterialApp(
          theme: AppTheme.light,
          home: const Scaffold(body: TasksPage()),
        ),
      ),
    );

    await tester.pumpAndSettle();
    expect(
      find.text('Unable to load tasks. Please try again.'),
      findsOneWidget,
    );
    expect(find.text('Retry'), findsOneWidget);
  });

  testWidgets('TasksPage interactions trigger mock service calls', (
    tester,
  ) async {
    final mockService = MockProductivityService();
    mockService.listTasksMock = () => Future.value([
      Task(
        id: 'task-1',
        title: 'Interact Task',
        description: 'Test',
        isCompleted: false,
        userId: 'u1',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
    ]);

    String? deletedId;
    mockService.deleteTaskMock = (id) async {
      deletedId = id;
    };

    bool updateCalled = false;
    mockService.updateTaskMock =
        (id, {String? title, String? description, bool? isCompleted}) async {
          updateCalled = true;
          return Task(
            id: id,
            title: title ?? 'Interact Task',
            isCompleted: isCompleted ?? true,
            userId: 'u1',
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          );
        };

    await tester.pumpWidget(
      ProviderScope(
        overrides: [productivityServiceProvider.overrideWithValue(mockService)],
        child: MaterialApp(
          theme: AppTheme.light,
          home: const Scaffold(body: TasksPage()),
        ),
      ),
    );

    await tester.pumpAndSettle();

    // Test check checkbox
    await tester.tap(find.byType(Checkbox));
    await tester.pumpAndSettle();
    expect(updateCalled, isTrue);

    // Test delete
    await tester.tap(find.byIcon(Icons.delete));
    await tester.pumpAndSettle();
    expect(deletedId, equals('task-1'));
  });
}
