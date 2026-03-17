import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:miru/core/design_system/design_system.dart';
import 'package:miru/features/rooms/pages/group_chat_page.dart';
import 'package:miru/core/models/chat_room.dart';

void main() {
  testWidgets('GroupChatPage handles StatusPill and rendering', (
    WidgetTester tester,
  ) async {
    final room = ChatRoom(
      id: 'test-room-id',
      name: 'Test Room',
      createdAt: '2024-01-01T00:00:00Z',
    );

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: Scaffold(body: GroupChatPage(room: room)),
      ),
    );

    expect(find.byType(GroupChatPage), findsOneWidget);
    // Since it tries to load APIs and fail gracefully via SnackBar, we pump once to let the future fire
    await tester.pump(const Duration(seconds: 1));
  });

  testWidgets('StatusPill renders successfully', (WidgetTester tester) async {
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
    await tester.pump(const Duration(seconds: 1));
  });
}
