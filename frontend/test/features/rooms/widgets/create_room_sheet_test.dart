import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:miru/features/rooms/widgets/create_room_sheet.dart';
import 'package:miru/core/design_system/theme/app_theme_data.dart';
import 'package:miru/core/models/agent.dart';
import 'package:miru/core/api/api_service.dart';
import 'package:miru/core/models/chat_room.dart';

class FakeApiService implements ApiService {
  Future<ChatRoom> Function(String)? createRoomMock;
  Future<void> Function(String, String)? addAgentToRoomMock;

  @override
  Future<ChatRoom> createRoom(String name) async {
    return createRoomMock?.call(name) ??
        Future.value(ChatRoom(id: '1', name: name, createdAt: ''));
  }

  @override
  Future<void> addAgentToRoom(String roomId, String agentId) async {
    return addAgentToRoomMock?.call(roomId, agentId) ?? Future.value();
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  late FakeApiService fakeApi;

  setUp(() {
    fakeApi = FakeApiService();
    ApiService.instance = fakeApi;
  });

  tearDown(() {
    ApiService.instance = null;
  });

  Widget buildTestWidget({required VoidCallback onCreated}) {
    return MaterialApp(
      theme: AppTheme.light,
      home: Scaffold(
        body: Builder(
          builder: (context) => Center(
            child: ElevatedButton(
              onPressed: () {
                showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  builder: (context) => CreateRoomSheet(
                    availableAgents: [
                      Agent(
                        id: '1',
                        name: 'Agent1',
                        personality: 'Funny',
                        createdAt: '',
                      ),
                      Agent(
                        id: '2',
                        name: 'Agent2',
                        personality: 'Serious',
                        createdAt: '',
                      ),
                    ],
                    onRoomCreated: onCreated,
                  ),
                );
              },
              child: const Text('Open Sheet'),
            ),
          ),
        ),
      ),
    );
  }

  testWidgets('CreateRoomSheet allows selecting agents and creates room', (
    tester,
  ) async {
    String? createdName;
    List<String>? selectedIds;
    bool wasCreated = false;

    fakeApi.createRoomMock = (name) {
      createdName = name;
      return Future.value(ChatRoom(id: '1', name: name, createdAt: ''));
    };
    fakeApi.addAgentToRoomMock = (roomId, agentId) {
      selectedIds ??= [];
      selectedIds!.add(agentId);
      return Future.value();
    };

    await tester.pumpWidget(
      buildTestWidget(
        onCreated: () {
          wasCreated = true;
        },
      ),
    );
    await tester.pumpAndSettle();

    // Open sheet
    await tester.tap(find.text('Open Sheet'));
    await tester.pumpAndSettle();

    // Verify agents are listed
    expect(find.text('Agent1'), findsOneWidget);
    expect(find.text('Agent2'), findsOneWidget);

    // Enter name
    await tester.enterText(find.byType(TextField), 'Test Room');
    await tester.pumpAndSettle();

    // Select an agent
    await tester.tap(find.text('Agent1'));
    await tester.pumpAndSettle();

    // Tap Create
    final createButton = find.widgetWithText(FilledButton, 'Create Room');
    expect(createButton, findsOneWidget);
    await tester.ensureVisible(createButton);
    await tester.tap(createButton);
    await tester.pumpAndSettle();

    expect(createdName, 'Test Room');
    expect(selectedIds, ['1']);
    expect(wasCreated, true);
  });

  testWidgets('CreateRoomSheet handles error gracefully', (tester) async {
    bool wasCreated = false;
    fakeApi.createRoomMock = (name) =>
        Future.error(Exception('Failed to create'));

    await tester.pumpWidget(
      buildTestWidget(
        onCreated: () {
          wasCreated = true;
        },
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Open Sheet'));
    await tester.pumpAndSettle();

    final createButton = find.widgetWithText(FilledButton, 'Create Room');
    await tester.ensureVisible(createButton);
    await tester.tap(createButton);
    await tester.pumpAndSettle();

    // The sheet should not close on error, and the callback should not be called
    expect(wasCreated, false);
    expect(find.byType(SnackBar), findsOneWidget);
    expect(find.textContaining('Failed to create'), findsOneWidget);
  });
}
