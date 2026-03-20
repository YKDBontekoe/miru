// Integration test entry point for the Linux desktop CI runner.
//
// This file re-runs the same widget test suites that live under test/ but via
// IntegrationTestWidgetsFlutterBinding, which uses LiveTestWidgetsFlutterBinding
// and therefore requires a real device (Linux desktop on CI, macOS locally if
// Xcode is available).
//
// Tests are deliberately zero-network: ApiService is injected with a fake and
// SupabaseService overrides prevent any real Supabase calls.
//
// To add a test:
//   1. Write it under test/features/... as a normal widget test.
//   2. Call its main() here so it also runs under the live binding.

import 'package:integration_test/integration_test.dart';

import '../test/features/auth/pages/auth_page_test.dart' as auth_page_tests;
import '../test/features/agents/pages/agents_page_test.dart'
    as agents_page_tests;
import '../test/features/rooms/pages/rooms_page_test.dart' as rooms_page_tests;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  // Re-run the same test groups under the live binding so rendering behaviour
  // (layout, painting, gesture dispatch) is exercised on a real embedder.
  auth_page_tests.main();
  agents_page_tests.main();
  rooms_page_tests.main();
}
