import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:miru/core/api/api_service.dart';
import 'package:miru/core/models/memory.dart';
import 'package:miru/features/settings/widgets/memory_browser.dart';
import 'package:miru/core/design_system/design_system.dart';

class MockApiService extends Mock implements ApiService {}

void main() {
  late MockApiService mockApiService;

  setUp(() {
    mockApiService = MockApiService();
    ApiService.instance = mockApiService;
  });

  tearDown(() {
    ApiService.instance = null;
  });

  Widget createWidgetUnderTest() {
    return MaterialApp(
      theme: AppTheme.light,
      home: Scaffold(body: MemoryBrowser()),
    );
  }

  testWidgets('MemoryBrowser shows loading state initially', (tester) async {
    when(
      () => mockApiService.getMemories(
        query: any(named: 'query'),
        collectionId: any(named: 'collectionId'),
      ),
    ).thenAnswer((_) async => []);
    when(() => mockApiService.getCollections()).thenAnswer((_) async => []);
    when(
      () => mockApiService.getMemoryGraph(),
    ).thenAnswer((_) async => const MemoryGraph());

    await tester.pumpWidget(createWidgetUnderTest());

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });

  testWidgets('MemoryBrowser displays memories and collections when loaded', (
    tester,
  ) async {
    when(
      () => mockApiService.getMemories(
        query: any(named: 'query'),
        collectionId: any(named: 'collectionId'),
      ),
    ).thenAnswer(
      (_) async => [
        const Memory(
          id: '1',
          content: 'Test mem',
          createdAt: '2023-10-01T12:00:00.000Z',
        ),
      ],
    );
    when(() => mockApiService.getCollections()).thenAnswer(
      (_) async => [
        MemoryCollection(
          id: 'col-1',
          name: 'Test Col',
          description: null,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      ],
    );
    when(
      () => mockApiService.getMemoryGraph(),
    ).thenAnswer((_) async => const MemoryGraph());

    await tester.pumpWidget(createWidgetUnderTest());
    await tester.pumpAndSettle();

    // Verify list view is shown by default and contains memory
    expect(find.text('Test mem'), findsOneWidget);

    // Switch to Collections tab
    await tester.tap(find.text('Folders'));
    await tester.pumpAndSettle();
    expect(find.text('Test Col'), findsOneWidget);

    // Switch to Timeline tab
    await tester.tap(find.text('Timeline'));
    await tester.pumpAndSettle();
    expect(
      find.text('Test mem'),
      findsOneWidget,
    ); // Timeline view renders it too
  });
}
