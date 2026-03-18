import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:miru/features/agents/pages/agents_page.dart';
import 'package:miru/core/design_system/theme/app_theme_data.dart';
import 'package:miru/core/api/api_service.dart';
import 'package:miru/core/models/agent.dart';
import 'package:miru/core/models/agent_info.dart';

class FakeApiService implements ApiService {
  Future<List<Agent>> Function()? getAgentsMock;
  Future<List<Capability>> Function()? getAgentCapabilitiesMock;
  Future<List<Integration>> Function()? getAgentIntegrationsMock;
  Future<AgentGenerationResponse> Function(String)? generateAgentMock;

  @override
  Future<List<Agent>> getAgents() async {
    return getAgentsMock?.call() ?? Future.value([]);
  }

  @override
  Future<List<Capability>> getAgentCapabilities() async {
    return getAgentCapabilitiesMock?.call() ?? Future.value([]);
  }

  @override
  Future<List<Integration>> getAgentIntegrations() async {
    return getAgentIntegrationsMock?.call() ?? Future.value([]);
  }

  @override
  Future<AgentGenerationResponse> generateAgent(String keywords) async {
    return generateAgentMock?.call(keywords) ??
        Future.value(
          AgentGenerationResponse(
            name: 'Test',
            description: 'Test',
            personality: 'Test',
            goals: ['Test'],
            capabilities: [],
            suggestedIntegrations: [],
          ),
        );
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  late FakeApiService fakeApi;

  setUp(() {
    fakeApi = FakeApiService();
    ApiService.instance =
        fakeApi; // We need to make sure ApiService allows injecting instance
  });

  tearDown(() {
    ApiService.instance = null;
  });

  Widget buildTestWidget() {
    return MaterialApp(theme: AppTheme.light, home: const AgentsPage());
  }

  testWidgets('AgentsPage simulates loading path', (tester) async {
    final completer = Completer<List<Agent>>();
    fakeApi.getAgentsMock = () => completer.future;

    await tester.pumpWidget(buildTestWidget());

    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    completer.complete([]);
    await tester.pumpAndSettle();
  });

  testWidgets('AgentsPage simulates API error', (tester) async {
    fakeApi.getAgentsMock = () => Future.error(Exception('Failed to load'));

    await tester.pumpWidget(buildTestWidget());
    await tester.pumpAndSettle();

    expect(find.byType(SnackBar), findsOneWidget);
    expect(find.textContaining('Failed to load'), findsOneWidget);
  });

  testWidgets('AgentsPage simulates empty agents response', (tester) async {
    fakeApi.getAgentsMock = () => Future.value([]);

    await tester.pumpWidget(buildTestWidget());
    await tester.pumpAndSettle();

    expect(find.text('No agents created yet.'), findsOneWidget);
  });

  testWidgets('AgentsPage simulates successful empty list and taps FAB', (
    tester,
  ) async {
    fakeApi.getAgentsMock = () => Future.value([]);
    fakeApi.getAgentCapabilitiesMock = () => Future.value([]);
    fakeApi.getAgentIntegrationsMock = () => Future.value([]);

    await tester.pumpWidget(buildTestWidget());
    await tester.pumpAndSettle();

    final fab = find.byType(FloatingActionButton);
    expect(fab, findsOneWidget);

    await tester.tap(fab);
    await tester.pumpAndSettle();

    expect(find.text('Create New Persona'), findsOneWidget);
    expect(find.byType(AlertDialog), findsOneWidget);
  });

  testWidgets('AgentsPage tests AI generation UI', (WidgetTester tester) async {
    fakeApi.getAgentsMock = () => Future.value([]);
    fakeApi.getAgentCapabilitiesMock = () => Future.value([]);
    fakeApi.getAgentIntegrationsMock = () => Future.value([]);

    await tester.pumpWidget(buildTestWidget());
    await tester.pumpAndSettle();

    final fab = find.byType(FloatingActionButton);
    await tester.tap(fab);
    await tester.pumpAndSettle();

    final generateField = find.widgetWithText(
      TextField,
      'e.g. pirate, funny, space',
    );
    expect(generateField, findsOneWidget);

    await tester.enterText(generateField, 'pirate');
    await tester.pumpAndSettle();

    final generateButton = find.byTooltip('Generate with AI');
    expect(generateButton, findsOneWidget);

    final completer = Completer<AgentGenerationResponse>();
    fakeApi.generateAgentMock = (keywords) => completer.future;

    await tester.tap(generateButton);
    await tester.pump();

    expect(find.text('Decoding...'), findsOneWidget);

    completer.complete(
      AgentGenerationResponse(
        name: 'Test',
        description: 'Test',
        personality: 'Test',
        goals: ['Test'],
        capabilities: [],
        suggestedIntegrations: [],
      ),
    );
    await tester.pumpAndSettle();

    // Verify the fields are filled out
    expect(find.text('Test'), findsWidgets);
  });

  testWidgets('AgentsPage tests submitting creation form', (
    WidgetTester tester,
  ) async {
    fakeApi.getAgentsMock = () => Future.value([]);
    fakeApi.getAgentCapabilitiesMock = () => Future.value([
      Capability(id: '1', name: 'Cap1', description: 'desc', icon: 'icon'),
    ]);
    fakeApi.getAgentIntegrationsMock = () => Future.value([
      Integration(
        type: 'type',
        displayName: 'Int1',
        icon: 'icon',
        description: 'desc',
        status: 'connected',
      ),
    ]);

    await tester.pumpWidget(buildTestWidget());
    await tester.pumpAndSettle();

    final fab = find.byType(FloatingActionButton);
    await tester.tap(fab);
    await tester.pumpAndSettle();

    final nameField = find.widgetWithText(TextField, 'e.g. Captain Bluebeard');
    await tester.enterText(nameField, 'New Agent');
    await tester.pumpAndSettle();

    final descriptionField = find.widgetWithText(
      TextField,
      'A seafaring AI who loves pirate jokes',
    );
    await tester.enterText(descriptionField, 'Test desc');
    await tester.pumpAndSettle();

    // Tap a capability chip to select it
    final capChip = find.text('Cap1');
    expect(capChip, findsOneWidget);
    await tester.ensureVisible(capChip);
    await tester.tap(capChip);
    await tester.pumpAndSettle();

    // Tap an integration chip to select it
    final intChip = find.text('Int1');
    expect(intChip, findsOneWidget);
    await tester.ensureVisible(intChip);
    await tester.tap(intChip);
    await tester.pumpAndSettle();

    // Tap save
    final saveButton = find.text('Create');
    expect(saveButton, findsOneWidget);
    await tester.ensureVisible(saveButton);
    await tester.tap(saveButton);
    await tester.pumpAndSettle();
  });
}
