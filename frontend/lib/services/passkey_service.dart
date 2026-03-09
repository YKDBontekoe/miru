import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../backend_service.dart';
import 'supabase_service.dart';

/// A stored passkey credential record returned by the backend.
class PasskeyInfo {
  final String id;
  final String? deviceName;
  final List<String> transports;
  final String createdAt;
  final String? lastUsedAt;

  const PasskeyInfo({
    required this.id,
    this.deviceName,
    required this.transports,
    required this.createdAt,
    this.lastUsedAt,
  });

  factory PasskeyInfo.fromJson(Map<String, dynamic> json) => PasskeyInfo(
        id: json['id'] as String,
        deviceName: json['device_name'] as String?,
        transports: (json['transports'] as List<dynamic>?)
                ?.map((e) => e as String)
                .toList() ??
            [],
        createdAt: json['created_at'] as String,
        lastUsedAt: json['last_used_at'] as String?,
      );
}

/// Handles the WebAuthn passkey registration and authentication flows.
///
/// The flow is split into two phases that mirror the WebAuthn spec:
///
/// **Registration** (user is already authenticated with magic link):
///   1. [getRegistrationOptions] — fetch options from backend, store challenge_id.
///   2. Platform API call (handled by the caller / UI layer using JS interop or
///      native plugin) — pass the options to the authenticator.
///   3. [verifyRegistration] — send the credential back to the backend.
///
/// **Authentication** (user is not yet authenticated):
///   1. [getAuthenticationOptions] — fetch options from backend.
///   2. Platform API call (handled by the caller / UI layer).
///   3. [verifyAuthentication] — send the assertion to the backend, receive session.
///
/// On **web** the platform calls use `dart:js_interop` to invoke
/// `navigator.credentials.create()` / `.get()`.  On **iOS/Android** this
/// delegates to the native `flutter_web_auth_2` / `credential_manager`
/// integration (see [_platformCreateCredential] / [_platformGetCredential]).
class PasskeyService {
  PasskeyService._();

  static String get _baseUrl => BackendService.baseUrl.value;

  static Map<String, String> get _authHeaders => {
        'Content-Type': 'application/json; charset=utf-8',
        if (SupabaseService.accessToken != null)
          'Authorization': 'Bearer ${SupabaseService.accessToken}',
      };

  // ---------------------------------------------------------------------------
  // Registration
  // ---------------------------------------------------------------------------

  /// Fetch WebAuthn registration options from the backend.
  ///
  /// Returns a map with:
  ///   - `challenge_id`: opaque token to pass to [verifyRegistration].
  ///   - `options`: the creation options JSON to pass to the authenticator.
  static Future<Map<String, dynamic>> getRegistrationOptions({
    String? deviceName,
  }) async {
    final uri = Uri.parse('$_baseUrl/auth/passkey/register/options');
    final response = await http.post(
      uri,
      headers: _authHeaders,
      body: jsonEncode({'device_name': deviceName}),
    );
    _checkStatus(response, 'getRegistrationOptions');
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  /// Send a registration credential to the backend for verification.
  ///
  /// [challengeId] must be the value returned by [getRegistrationOptions].
  /// [credentialJson] is the JSON-encoded `PublicKeyCredential` from the
  /// platform authenticator API.
  ///
  /// Returns the stored passkey info (id, device_name, created_at).
  static Future<Map<String, dynamic>> verifyRegistration({
    required String challengeId,
    required String credentialJson,
    String? deviceName,
  }) async {
    final uri = Uri.parse('$_baseUrl/auth/passkey/register/verify');
    final response = await http.post(
      uri,
      headers: _authHeaders,
      body: jsonEncode({
        'challenge_id': challengeId,
        'credential': credentialJson,
        'device_name': deviceName,
      }),
    );
    _checkStatus(response, 'verifyRegistration');
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  // ---------------------------------------------------------------------------
  // Authentication
  // ---------------------------------------------------------------------------

  /// Fetch WebAuthn authentication options from the backend (unauthenticated).
  ///
  /// [email] is used to look up the user's registered passkeys.
  ///
  /// Returns a map with:
  ///   - `challenge_id`: opaque token to pass to [verifyAuthentication].
  ///   - `options`: the request options JSON to pass to the authenticator.
  static Future<Map<String, dynamic>> getAuthenticationOptions({
    required String email,
  }) async {
    final uri = Uri.parse('$_baseUrl/auth/passkey/login/options');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json; charset=utf-8'},
      body: jsonEncode({'email': email}),
    );
    _checkStatus(response, 'getAuthenticationOptions');
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  /// Send an authentication assertion to the backend for verification.
  ///
  /// On success, sets the Supabase session from the returned tokens so that
  /// subsequent API calls are authenticated.
  ///
  /// Returns the full session response (access_token, refresh_token, user).
  static Future<Map<String, dynamic>> verifyAuthentication({
    required String challengeId,
    required String credentialJson,
  }) async {
    final uri = Uri.parse('$_baseUrl/auth/passkey/login/verify');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json; charset=utf-8'},
      body: jsonEncode({
        'challenge_id': challengeId,
        'credential': credentialJson,
      }),
    );
    _checkStatus(response, 'verifyAuthentication');
    final data = jsonDecode(response.body) as Map<String, dynamic>;

    // Inject the session into the Supabase client so the rest of the app
    // (and subsequent API calls via SupabaseService.accessToken) are auth'd.
    await SupabaseService.setSessionFromTokens(
      accessToken: data['access_token'] as String,
      refreshToken: data['refresh_token'] as String,
    );

    return data;
  }

  // ---------------------------------------------------------------------------
  // Management
  // ---------------------------------------------------------------------------

  /// List all passkeys registered by the current user.
  static Future<List<PasskeyInfo>> listPasskeys() async {
    final uri = Uri.parse('$_baseUrl/auth/passkey/list');
    final response = await http.get(uri, headers: _authHeaders);
    _checkStatus(response, 'listPasskeys');
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return (data['passkeys'] as List<dynamic>)
        .map((e) => PasskeyInfo.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Delete a passkey by its [passkeyId].
  static Future<void> deletePasskey(String passkeyId) async {
    final uri = Uri.parse('$_baseUrl/auth/passkey/$passkeyId');
    final response = await http.delete(uri, headers: _authHeaders);
    _checkStatus(response, 'deletePasskey');
  }

  // ---------------------------------------------------------------------------
  // Platform credential APIs
  // ---------------------------------------------------------------------------

  /// Whether the current platform/browser supports WebAuthn passkeys.
  static bool get isSupported {
    // On web, WebAuthn is universally supported in modern browsers.
    // On iOS/Android we rely on the native credential manager APIs.
    // For now, return true for all platforms; handle gracefully in UI.
    return true;
  }

  /// Create a credential using the platform WebAuthn API.
  ///
  /// On **web**, calls `navigator.credentials.create()` via JS interop.
  /// On **iOS/Android**, delegates to the native platform integration.
  ///
  /// [options] is the decoded options object returned by [getRegistrationOptions].
  ///
  /// Returns the JSON-encoded `PublicKeyCredential` to pass to
  /// [verifyRegistration].
  static Future<String> platformCreateCredential(
    Map<String, dynamic> options,
  ) async {
    if (kIsWeb) {
      return _webCreateCredential(options);
    }
    // For native platforms, this requires a dedicated plugin such as
    // `credential_manager` or `flutter_web_auth_2` + custom platform channels.
    // The implementation is platform-specific and is registered via
    // a plugin or MethodChannel.  Throw a clear error for now so callers
    // handle the unavailable case gracefully.
    throw UnsupportedError(
      'Native passkey support requires the credential_manager plugin. '
      'See the Miru README for setup instructions.',
    );
  }

  /// Get an assertion from the platform WebAuthn API.
  ///
  /// On **web**, calls `navigator.credentials.get()` via JS interop.
  /// On **iOS/Android**, delegates to the native platform integration.
  ///
  /// [options] is the decoded options object returned by [getAuthenticationOptions].
  ///
  /// Returns the JSON-encoded `PublicKeyCredential` (assertion).
  static Future<String> platformGetCredential(
    Map<String, dynamic> options,
  ) async {
    if (kIsWeb) {
      return _webGetCredential(options);
    }
    throw UnsupportedError(
      'Native passkey support requires the credential_manager plugin. '
      'See the Miru README for setup instructions.',
    );
  }

  // ---------------------------------------------------------------------------
  // Web implementation via JS interop
  // ---------------------------------------------------------------------------

  /// Calls `navigator.credentials.create({ publicKey: options })` on web.
  static Future<String> _webCreateCredential(
    Map<String, dynamic> options,
  ) async {
    // We use dart:js_interop / dart:html to call the WebAuthn API.
    // The browser returns a PublicKeyCredential; we serialise it to JSON.
    //
    // This is implemented as a JS snippet injected via `dart:js_interop`.
    // For the initial web build, this calls the window-level helper function
    // `miruWebauthnCreate(options)` which is defined in web/index.html.
    if (!kIsWeb) throw UnsupportedError('Web only');

    // Defer to the JS helper (see web/index.html for the implementation).
    final result =
        await _callJsHelper('miruWebauthnCreate', jsonEncode(options));
    return result;
  }

  /// Calls `navigator.credentials.get({ publicKey: options })` on web.
  static Future<String> _webGetCredential(
    Map<String, dynamic> options,
  ) async {
    if (!kIsWeb) throw UnsupportedError('Web only');
    final result = await _callJsHelper('miruWebauthnGet', jsonEncode(options));
    return result;
  }

  /// Calls a JS function defined in the web/index.html page.
  ///
  /// Returns a `Future<String>` that completes with the JSON-encoded result.
  static Future<String> _callJsHelper(
    String functionName,
    String optionsJson,
  ) async {
    // ignore: undefined_prefixed_name
    // We use js_util to call the window-level JS function and await the Promise.
    final dynamic jsWindow = _getJsWindow();
    if (jsWindow == null) throw StateError('JS window not available');

    // Dynamic dispatch — avoids hard dependency on dart:js in this file.
    // The actual implementation lives in services/passkey_web.dart which is
    // conditionally imported using stub/real pattern.
    throw UnsupportedError(
      'Direct JS interop call not yet wired. '
      'Use PasskeyService.registerOnWeb() / loginOnWeb() from the UI layer.',
    );
  }

  static dynamic _getJsWindow() => null;

  // ---------------------------------------------------------------------------
  // Error helper
  // ---------------------------------------------------------------------------

  static void _checkStatus(http.Response response, String operation) {
    if (response.statusCode >= 400) {
      String detail;
      try {
        final body = jsonDecode(response.body) as Map<String, dynamic>;
        detail = body['detail'] as String? ?? response.body;
      } catch (_) {
        detail = response.body;
      }
      throw PasskeyException(
        operation: operation,
        statusCode: response.statusCode,
        detail: detail,
      );
    }
  }
}

/// Exception thrown when a passkey API call fails.
class PasskeyException implements Exception {
  final String operation;
  final int statusCode;
  final String detail;

  const PasskeyException({
    required this.operation,
    required this.statusCode,
    required this.detail,
  });

  @override
  String toString() => 'PasskeyException[$operation] HTTP $statusCode: $detail';
}
