import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:miru/features/agents/pages/agents_page.dart';
import 'package:miru/core/design_system/theme/app_theme_data.dart';
import 'package:miru/core/api/api_service.dart';
import 'package:miru/core/models/agent.dart';
import 'package:miru/core/models/agent_info.dart';
import 'package:miru/core/services/supabase_service.dart';

class FakeApiService implements ApiService {
  Future<List<Agent>> Function()? getAgentsMock;
  Future<List<Capability>> Function()? getAgentCapabilitiesMock;
  Future<List<Integration>> Function()? getAgentIntegrationsMock;

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
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  late FakeApiService fakeApi;

  setUp(() {
    fakeApi = FakeApiService();
    ApiService.instance = fakeApi;
    // Prevent _getDio() from calling Supabase.instance when there is no
    // initialised Supabase client in tests.
    SupabaseService.accessTokenOverride = null;
  });

  tearDown(() {
    ApiService.instance = null;
    SupabaseService.accessTokenOverride =
        SupabaseService.sentinel; // reset to no-override
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
    // Use pump instead of pumpAndSettle to avoid timeout from repeating animations.
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
  });

  testWidgets('AgentsPage simulates empty agents response', (tester) async {
    fakeApi.getAgentsMock = () => Future.value([]);

    await tester.pumpWidget(buildTestWidget());
    // Use pump instead of pumpAndSettle to avoid timeout from repeating animations.
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    // Now uses AppEmptyState with updated text.
    expect(find.text('No personas yet'), findsOneWidget);
  });

  testWidgets('AgentsPage simulates successful empty list and taps FAB', (
    tester,
  ) async {
    fakeApi.getAgentsMock = () => Future.value([]);
    fakeApi.getAgentCapabilitiesMock = () => Future.value([]);
    fakeApi.getAgentIntegrationsMock = () => Future.value([]);

    await tester.pumpWidget(buildTestWidget());
    // Use pump instead of pumpAndSettle to avoid timeout from repeating animations.
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    final fab = find.byType(FloatingActionButton);
    expect(fab, findsOneWidget);

    await tester.tap(fab);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Create New Persona'), findsOneWidget);
    expect(find.byType(AlertDialog), findsOneWidget);
  });
}
