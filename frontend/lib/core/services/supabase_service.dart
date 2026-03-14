import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// A thin wrapper around [Supabase] auth for Miru.
///
/// Responsibilities:
///   - Initialise the Supabase client with the correct URL and anon key.
///   - Send magic-link emails.
///   - Sign out.
///   - Expose the current session / user for the rest of the app.
///   - Persist the session securely using [FlutterSecureStorage] on
///     mobile and the default SharedPreferences-backed storage on web
///     (since flutter_secure_storage doesn't support web).
class SupabaseService {
  SupabaseService._();

  // ---------------------------------------------------------------------------
  // Configuration — replace with your project values.
  // These can also be read from dart-define / env at build time.
  // ---------------------------------------------------------------------------

  /// Your Supabase project URL.
  /// Set via --dart-define=SUPABASE_URL=https://xxx.supabase.co
  static const String _supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://your-project.supabase.co',
  );

  /// The anon key (safe for client-side use).
  /// Set via --dart-define=SUPABASE_ANON_KEY=eyJ...
  static const String _supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'your-anon-key',
  );

  // ---------------------------------------------------------------------------
  // Initialisation
  // ---------------------------------------------------------------------------

  /// Initialise the Supabase client.  Must be called once before any auth ops.
  static Future<void> initialize({String? url, String? anonKey}) async {
    final localStorage = kIsWeb
        ? SharedPreferencesLocalStorage(
            persistSessionKey: 'miru-supabase-session',
          )
        : _SecureLocalStorage();

    await Supabase.initialize(
      url: url ?? _supabaseUrl,
      anonKey: anonKey ?? _supabaseAnonKey,
      debug: true,
      authOptions: FlutterAuthClientOptions(
        authFlowType: AuthFlowType.pkce,
        localStorage: localStorage,
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Convenience getters
  // ---------------------------------------------------------------------------

  static SupabaseClient get _client => Supabase.instance.client;

  /// The currently authenticated [User], or null if not signed in.
  static User? get currentUser => _client.auth.currentUser;

  /// The current [Session], or null if not signed in.
  static Session? get currentSession => _client.auth.currentSession;

  /// Whether a user is currently authenticated.
  static bool get isAuthenticated => currentUser != null;

  /// Stream of [AuthState] changes — listen to react to sign-in / sign-out.
  static Stream<AuthState> get authStateChanges =>
      _client.auth.onAuthStateChange;

  /// The JWT access token for the current session (to send to the backend).
  static String? get accessToken => currentSession?.accessToken;

  // ---------------------------------------------------------------------------
  // Auth operations
  // ---------------------------------------------------------------------------

  /// Send a magic link to [email].
  ///
  /// The user must click the link in their email to complete sign-in.
  /// Deep-link handling is configured in [main.dart].
  ///
  /// [redirectTo] should be the deep-link URI registered for your app,
  /// e.g. `io.miru.app://login-callback`.  On web it can be null (Supabase
  /// redirects to the current origin).
  static Future<void> signInWithMagicLink({
    required String email,
    String? redirectTo,
  }) async {
    await _client.auth.signInWithOtp(
      email: email,
      emailRedirectTo: redirectTo,
      shouldCreateUser: true,
    );
  }

  /// Sign the current user out and clear the local session.
  static Future<void> signOut() async {
    await _client.auth.signOut();
  }

  /// Manually set a session from tokens returned by the passkey login flow.
  ///
  /// Called after a successful passkey authentication: the backend returns
  /// Supabase-compatible ``access_token`` and ``refresh_token`` values which
  /// we inject directly into the Supabase client.
  static Future<AuthResponse> setSessionFromTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    return _client.auth.setSession(refreshToken);
  }
}

// ---------------------------------------------------------------------------
// Secure local storage (mobile only)
// ---------------------------------------------------------------------------

/// A [LocalStorage] implementation backed by [FlutterSecureStorage].
///
/// Used on iOS and Android to store the Supabase session in the keychain /
/// keystore rather than plain SharedPreferences.
class _SecureLocalStorage extends LocalStorage {
  static const _storage = FlutterSecureStorage(
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  static const _key = 'miru_supabase_session';

  @override
  Future<void> initialize() async {}

  @override
  Future<String?> accessToken() => _storage.read(key: _key);

  @override
  Future<bool> hasAccessToken() async {
    final value = await _storage.read(key: _key);
    return value != null;
  }

  @override
  Future<void> persistSession(String persistSessionString) =>
      _storage.write(key: _key, value: persistSessionString);

  @override
  Future<void> removePersistedSession() => _storage.delete(key: _key);
}
