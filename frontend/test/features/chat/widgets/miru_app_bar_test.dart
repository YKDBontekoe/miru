import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:miru/core/design_system/design_system.dart';
import 'package:miru/features/chat/widgets/miru_app_bar.dart';

void main() {
  testWidgets('MiruAppBar renders correctly', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          appBar: MiruAppBar(
            colors: AppThemeColors.light(),
            isDark: false,
            showNewChat: true,
            onNewChat: () {},
            onSettingsPressed: () {},
          ),
          body: const SizedBox(),
        ),
      ),
    );
    await tester.pump();
    expect(find.byType(MiruAppBar), findsOneWidget);
  });
}
