import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:miru/core/design_system/design_system.dart';
import 'package:miru/features/rooms/pages/group_chat_page.dart';
import 'package:miru/features/rooms/widgets/status_pill.dart';
import 'package:miru/core/models/chat_room.dart';
import 'package:miru/core/models/agent.dart';
import 'package:miru/core/models/chat_message.dart';
import 'package:miru/core/api/api_service.dart';

class MockApiService extends ApiService {
  bool shouldThrow = false;
  List<Agent> mockAgents = [
    Agent(
      id: '1',
      name: 'Alice',
      personality: 'Friendly',
      createdAt: '2024-01-01T00:00:00Z',
    ),
  ];
  List<ChatMessage> mockMessages = [];
  bool streamCalled = false;

  @override
  Future<List<Agent>> getRoomAgents(String roomId) async {
    if (shouldThrow) throw Exception('API Error');
    return mockAgents;
  }

  @override
  Future<List<ChatMessage>> getRoomMessages(String roomId) async {
    if (shouldThrow) throw Exception('API Error');
    return mockMessages;
  }

  @override
  Stream<String> streamRoomChat(String roomId, String message) async* {
    streamCalled = true;
    yield "[[STATUS:loading_agent:1:Alice]]";
    // Delay slightly to allow the UI to consume the status before the agent switch event
    // replacing the status happens.
    await Future.delayed(const Duration(milliseconds: 100));
    yield "[[AGENT:1:Alice]]Hello! I am a mock agent.";
  }
}

void main() {
  late MockApiService mockApi;
  late ChatRoom room;

  setUp(() {
    mockApi = MockApiService();
    ApiService.instance = mockApi;
    room = ChatRoom(
      id: 'test-room-id',
      name: 'Test Room',
      createdAt: '2024-01-01T00:00:00Z',
    );
  });

  testWidgets('GroupChatPage handles StatusPill, empty state, and rendering', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: Scaffold(body: GroupChatPage(room: room)),
      ),
    );

    // Initial Loading State
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    // Resolve Futures
    await tester.pumpAndSettle();

    // Empty state should be visible since mockMessages is empty
    expect(find.text('No messages yet'), findsOneWidget);

    // Enter Text to simulate a user sending a message
    await tester.enterText(find.byType(TextField), 'Testing chat');
    final sendButton = find.byIcon(Icons.arrow_upward_rounded);
    await tester.tap(sendButton);
    await tester.pump();

    // Pump to process the first stream yield (the status pill)
    await tester.pump(const Duration(milliseconds: 10));

    // Assert stream was invoked
    expect(mockApi.streamCalled, isTrue);

    // StatusPill should now show due to [[STATUS:loading_agent:1:Alice]]
    expect(find.byType(StatusPill), findsOneWidget);
    expect(find.text('Alice is thinking...'), findsOneWidget);

    // Settle to let the stream finish and close
    await tester.pumpAndSettle();
  });

  testWidgets('GroupChatPage displays error when API throws', (
    WidgetTester tester,
  ) async {
    mockApi.shouldThrow = true;

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: Scaffold(body: GroupChatPage(room: room)),
      ),
    );

    await tester.pumpAndSettle();
    // Verify the SnackBar is displayed showing the error
    expect(
      find.textContaining('Error loading chat: Exception: API Error'),
      findsOneWidget,
    );
  });

  testWidgets('StatusPill renders successfully in isolation', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: Builder(
          builder: (context) {
            return Scaffold(
              body: StatusPill(label: 'Loading...', colors: context.colors),
            );
          },
        ),
      ),
    );

    expect(find.text('Loading...'), findsOneWidget);
    expect(find.byType(StatusPill), findsOneWidget);
    await tester.pump(
      const Duration(milliseconds: 500),
    ); // To prevent timer assertion failure due to repeating animation
  });
}
