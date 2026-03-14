import 'dart:async';
import 'dart:convert';

import 'package:credential_manager/credential_manager.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import 'package:miru/core/api/backend_service.dart';
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
class PasskeyService {
  PasskeyService._();

  static final CredentialManager _credentialManager = CredentialManager();

  static String get _baseUrl => BackendService.baseUrl.value;

  static Map<String, String> get _authHeaders => {
        'Content-Type': 'application/json; charset=utf-8',
        if (SupabaseService.accessToken != null)
          'Authorization': 'Bearer ${SupabaseService.accessToken}',
      };

  /// Initialise the credential manager.
  static Future<void> initialize() async {
    if (kIsWeb) return;
    if (_credentialManager.isSupportedPlatform) {
      await _credentialManager.init(
        preferImmediatelyAvailableCredentials: true,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Registration
  // ---------------------------------------------------------------------------

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

    await SupabaseService.setSessionFromTokens(
      accessToken: data['access_token'] as String,
      refreshToken: data['refresh_token'] as String,
    );

    return data;
  }

  // ---------------------------------------------------------------------------
  // Management
  // ---------------------------------------------------------------------------

  static Future<List<PasskeyInfo>> listPasskeys() async {
    final uri = Uri.parse('$_baseUrl/auth/passkey/list');
    final response = await http.get(uri, headers: _authHeaders);
    _checkStatus(response, 'listPasskeys');
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return (data['passkeys'] as List<dynamic>)
        .map((e) => PasskeyInfo.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<void> deletePasskey(String passkeyId) async {
    final uri = Uri.parse('$_baseUrl/auth/passkey/$passkeyId');
    final response = await http.delete(uri, headers: _authHeaders);
    _checkStatus(response, 'deletePasskey');
  }

  // ---------------------------------------------------------------------------
  // Platform credential APIs
  // ---------------------------------------------------------------------------

  static bool get isSupported {
    if (kIsWeb) return true;
    return _credentialManager.isSupportedPlatform;
  }

  static Future<String> platformCreateCredential(
    Map<String, dynamic> options,
  ) async {
    if (kIsWeb) {
      return _webCreateCredential(options);
    }

    if (_credentialManager.isSupportedPlatform) {
      final res = await _credentialManager.savePasskeyCredentials(
        request: CredentialCreationOptions.fromJson(options),
      );
      // res is a PublicKeyCredential object
      return jsonEncode(res.toJson());
    }

    throw UnsupportedError(
      'Native passkey support is not available on this platform.',
    );
  }

  static Future<String> platformGetCredential(
    Map<String, dynamic> options,
  ) async {
    if (kIsWeb) {
      return _webGetCredential(options);
    }

    if (_credentialManager.isSupportedPlatform) {
      final challenge = options['challenge'] as String;
      final rpId = (options['rpId'] ?? options['rp_id'] ?? options['rp']?['id'])
          as String?;

      final credential = await _credentialManager.getCredentials(
        passKeyOption: CredentialLoginOptions(
          challenge: challenge,
          rpId: rpId ?? '',
          userVerification: "required",
        ),
      );

      if (credential.publicKeyCredential != null) {
        return jsonEncode(credential.publicKeyCredential!.toJson());
      }
    }

    throw UnsupportedError(
      'Native passkey support is not available on this platform.',
    );
  }

  // ---------------------------------------------------------------------------
  // Web implementation via JS interop
  // ---------------------------------------------------------------------------

  static Future<String> _webCreateCredential(
    Map<String, dynamic> options,
  ) async {
    if (!kIsWeb) throw UnsupportedError('Web only');
    final result = await _callJsHelper(
      'miruWebauthnCreate',
      jsonEncode(options),
    );
    return result;
  }

  static Future<String> _webGetCredential(Map<String, dynamic> options) async {
    if (!kIsWeb) throw UnsupportedError('Web only');
    final result = await _callJsHelper('miruWebauthnGet', jsonEncode(options));
    return result;
  }

  static Future<String> _callJsHelper(
    String functionName,
    String optionsJson,
  ) async {
    throw UnsupportedError(
      'Direct JS interop call not yet wired. '
      'Use PasskeyService.registerOnWeb() / loginOnWeb() from the UI layer.',
    );
  }

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
