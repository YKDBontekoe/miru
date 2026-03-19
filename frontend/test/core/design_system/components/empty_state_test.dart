import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:miru/core/design_system/components/empty_state.dart';
import 'package:miru/core/design_system/theme/app_theme_data.dart';

void main() {
  Widget buildTestWidget({
    required Widget child,
    ThemeMode themeMode = ThemeMode.light,
  }) {
    return MaterialApp(
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: themeMode,
      home: Scaffold(body: child),
    );
  }

  testWidgets('AppEmptyState renders title and subtitle correctly', (
    tester,
  ) async {
    await tester.pumpWidget(
      buildTestWidget(
        child: const AppEmptyState(
          title: 'Hello Miru',
          subtitle: 'This is a test subtitle',
          suggestions: ['Ask me anything'],
        ),
      ),
    );

    expect(find.text('Hello Miru'), findsOneWidget);
    expect(find.text('This is a test subtitle'), findsOneWidget);
    expect(find.text('Ask me anything'), findsOneWidget);
    expect(find.byType(Icon), findsWidgets);
  });

  testWidgets('AppEmptyState handles action button', (tester) async {
    await tester.pumpWidget(
      buildTestWidget(
        child: AppEmptyState(
          title: 'Hello Miru',
          action: ElevatedButton(
            onPressed: () {},
            child: const Text('Action Button'),
          ),
        ),
      ),
    );

    expect(find.text('Action Button'), findsOneWidget);
  });

  testWidgets('AppEmptyState triggers onSuggestionTap callback', (
    tester,
  ) async {
    String? capturedSuggestion;
    await tester.pumpWidget(
      buildTestWidget(
        child: AppEmptyState(
          title: 'Hello Miru',
          suggestions: const ['Ask me anything'],
          onSuggestionTap: (text) => capturedSuggestion = text,
        ),
      ),
    );

    await tester.tap(find.text('Ask me anything'));
    await tester.pump();

    expect(capturedSuggestion, equals('Ask me anything'));
  });

  // --- Additional tests for PR changes ---

  testWidgets('AppEmptyState renders without subtitle when omitted', (
    tester,
  ) async {
    await tester.pumpWidget(
      buildTestWidget(
        child: const AppEmptyState(title: 'Title Only'),
      ),
    );

    expect(find.text('Title Only'), findsOneWidget);
    expect(find.text('This is a test subtitle'), findsNothing);
  });

  testWidgets('AppEmptyState renders no suggestion chips when list is empty', (
    tester,
  ) async {
    await tester.pumpWidget(
      buildTestWidget(
        child: const AppEmptyState(
          title: 'No Suggestions',
          suggestions: [],
        ),
      ),
    );

    expect(find.text('No Suggestions'), findsOneWidget);
    expect(find.byIcon(Icons.auto_awesome_rounded), findsNothing);
  });

  testWidgets('AppEmptyState renders no action widget when action is omitted', (
    tester,
  ) async {
    await tester.pumpWidget(
      buildTestWidget(
        child: const AppEmptyState(title: 'No Action'),
      ),
    );

    expect(find.text('No Action'), findsOneWidget);
    expect(find.byType(ElevatedButton), findsNothing);
  });

  testWidgets('AppEmptyState renders multiple suggestion chips', (
    tester,
  ) async {
    const suggestions = ['First suggestion', 'Second suggestion', 'Third'];
    await tester.pumpWidget(
      buildTestWidget(
        child: const AppEmptyState(
          title: 'Multi Suggestions',
          suggestions: suggestions,
        ),
      ),
    );

    for (final s in suggestions) {
      expect(find.text(s), findsOneWidget);
    }
    expect(find.byIcon(Icons.auto_awesome_rounded), findsNWidgets(3));
  });

  testWidgets(
    'AppEmptyState triggers onSuggestionTap with correct text for each chip',
    (tester) async {
      const suggestions = ['Option A', 'Option B'];
      String? lastTapped;

      await tester.pumpWidget(
        buildTestWidget(
          child: AppEmptyState(
            title: 'Multi Tap',
            suggestions: suggestions,
            onSuggestionTap: (text) => lastTapped = text,
          ),
        ),
      );

      await tester.tap(find.text('Option B'));
      await tester.pump();
      expect(lastTapped, equals('Option B'));

      await tester.tap(find.text('Option A'));
      await tester.pump();
      expect(lastTapped, equals('Option A'));
    },
  );

  testWidgets(
    'AppEmptyState does not throw when tapping chip with no callback',
    (tester) async {
      await tester.pumpWidget(
        buildTestWidget(
          child: const AppEmptyState(
            title: 'No Callback',
            suggestions: ['Tap me'],
          ),
        ),
      );

      // Should not throw when tapped without a callback registered
      await tester.tap(find.text('Tap me'));
      await tester.pump();
    },
  );

  testWidgets('AppEmptyState renders the main orb icon', (tester) async {
    await tester.pumpWidget(
      buildTestWidget(
        child: const AppEmptyState(title: 'Icon Test'),
      ),
    );

    expect(find.byIcon(Icons.blur_on_rounded), findsOneWidget);
  });

  testWidgets('AppEmptyState renders correctly in dark mode', (tester) async {
    await tester.pumpWidget(
      buildTestWidget(
        child: const AppEmptyState(
          title: 'Dark Mode Title',
          subtitle: 'Dark subtitle',
          suggestions: ['Dark suggestion'],
        ),
        themeMode: ThemeMode.dark,
      ),
    );

    expect(find.text('Dark Mode Title'), findsOneWidget);
    expect(find.text('Dark subtitle'), findsOneWidget);
    expect(find.text('Dark suggestion'), findsOneWidget);
  });

  testWidgets('AppEmptyState is wrapped in a Center widget', (tester) async {
    await tester.pumpWidget(
      buildTestWidget(
        child: const AppEmptyState(title: 'Centered'),
      ),
    );

    expect(find.byType(Center), findsOneWidget);
  });
}