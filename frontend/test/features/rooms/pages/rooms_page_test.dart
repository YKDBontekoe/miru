import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:miru/core/design_system/design_system.dart';
import 'package:miru/features/rooms/pages/rooms_page.dart';
import 'package:miru/core/api/api_service.dart';
import 'package:miru/core/models/chat_room.dart';
import 'package:miru/core/models/agent.dart';

class MockRoomsApiService extends ApiService {
  bool shouldThrow = false;
  List<Agent> mockAgents = [];
  List<ChatRoom> mockRooms = [];

  @override
  Future<List<Agent>> getAgents() async {
    if (shouldThrow) throw Exception('API Error');
    return mockAgents;
  }

  @override
  Future<List<ChatRoom>> getRooms() async {
    if (shouldThrow) throw Exception('API Error');
    return mockRooms;
  }
}

void main() {
  late MockRoomsApiService mockApi;

  setUp(() {
    mockApi = MockRoomsApiService();
    ApiService.instance = mockApi;
  });

  testWidgets('RoomsPage renders empty state successfully', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: const Scaffold(body: RoomsPage()),
      ),
    );

    // Initial loading UI check - 2 loaders (one for agents, one for rooms)
    expect(find.byType(CircularProgressIndicator), findsNWidgets(2));

    // Resolve futures
    await tester.pumpAndSettle();

    // Verify empty state placeholders
    expect(find.text('No personas yet. Tap + to create one.'), findsOneWidget);
    expect(find.text('No conversations yet'), findsOneWidget);
  });

  testWidgets('RoomsPage renders successful populated list state', (
    WidgetTester tester,
  ) async {
    // Populate mock data
    mockApi.mockAgents = [
      Agent(
        id: 'agent1',
        name: 'Alice',
        personality: 'Friendly',
        createdAt: '2024-01-01T00:00:00Z',
      ),
    ];
    mockApi.mockRooms = [
      ChatRoom(
        id: 'room1',
        name: 'Alpha Room',
        createdAt: '2024-01-01T00:00:00Z',
      ),
    ];

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: const Scaffold(body: RoomsPage()),
      ),
    );

    // Initial loading UI check
    expect(find.byType(CircularProgressIndicator), findsNWidgets(2));

    await tester.pumpAndSettle();

    // Should render the items
    expect(find.text('Alice'), findsOneWidget);
    expect(find.text('Alpha Room'), findsOneWidget);
  });

  testWidgets('RoomsPage handles API errors gracefully', (
    WidgetTester tester,
  ) async {
    mockApi.shouldThrow = true;

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: const Scaffold(body: RoomsPage()),
      ),
    );

    expect(find.byType(CircularProgressIndicator), findsNWidgets(2));

    // Pump frames to let the snackbars enter the tree
    await tester.pump(const Duration(milliseconds: 100));
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.byType(SnackBar), findsWidgets);

    await tester.pumpAndSettle();
  });
}
