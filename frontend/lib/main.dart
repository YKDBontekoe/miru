import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

import 'package:miru/core/api/backend_service.dart';
import 'package:miru/core/design_system/design_system.dart';
import 'package:miru/core/services/passkey_service.dart';
import 'package:miru/core/services/supabase_service.dart';
import 'package:miru/features/auth/pages/auth_page.dart';
import 'package:miru/features/auth/pages/loading_page.dart';
import 'package:miru/features/chat/pages/main_scaffold.dart';
import 'package:miru/features/onboarding/pages/introduction_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialise local prefs (backend URL, onboarding state).
  await BackendService.init();

  // Initialise Supabase auth (session persistence, deep-link handling).
  await SupabaseService.initialize();

  // Initialise Passkey support.
  await PasskeyService.initialize();

  const sentryDsn = String.fromEnvironment('SENTRY_DSN');
  if (sentryDsn.isNotEmpty) {
    await SentryFlutter.init(
      (options) {
        options.dsn = sentryDsn;
      },
      appRunner: () => runApp(const ProviderScope(child: MiruApp())),
    );
  } else {
    runApp(const ProviderScope(child: MiruApp()));
  }
}

class MiruApp extends StatefulWidget {
  const MiruApp({super.key});

  @override
  State<MiruApp> createState() => _MiruAppState();
}

class _MiruAppState extends State<MiruApp> {
  late final Stream<AuthState> _authStream;

  @override
  void initState() {
    super.initState();
    _authStream = SupabaseService.authStateChanges;
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Miru',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.system,
      home: LoadingPage(
        child: StreamBuilder<AuthState>(
          stream: _authStream,
          builder: (context, snapshot) {
            // While we wait for the first auth state event, show the correct
            // initial page synchronously from the cached session.
            final isAuthenticated = SupabaseService.isAuthenticated;

            if (isAuthenticated) {
              // Show onboarding on first launch, then chat.
              if (!BackendService.onboardingComplete.value) {
                return const IntroductionPage();
              }
              return const MainScaffold();
            }

            return const AuthPage();
          },
        ),
      ),
    );
  }
}
