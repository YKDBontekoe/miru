import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class BackendService {
  static const String _storageKey = 'miru_backend_url';
  static const String _onboardingKey = 'miru_onboarding_complete';
  static const String _fallbackUrl =
      'https://aca-miru.whitefield-4145d509.westeurope.azurecontainerapps.io/api/v1';

  static const String _azureUrl = String.fromEnvironment(
    'BACKEND_URL',
    defaultValue: _fallbackUrl,
  );

  static String get _defaultUrl => _resolveDefaultUrl();

  static final ValueNotifier<String> baseUrl = ValueNotifier(_defaultUrl);
  static final ValueNotifier<bool> onboardingComplete = ValueNotifier(false);

  // A visible-for-testing flag to bypass the backend wait in tests
  @visibleForTesting
  static bool bypassWaitForBackend = false;

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();

    final savedUrl = prefs.getString(_storageKey);
    if (savedUrl != null) {
      try {
        baseUrl.value = normalizeBaseUrl(savedUrl);
      } on FormatException catch (error) {
        debugPrint('Ignoring invalid saved backend URL: ${error.message}');
        await prefs.remove(_storageKey);
      }
    }

    onboardingComplete.value = prefs.getBool(_onboardingKey) ?? false;
  }

  static Future<void> setOnboardingComplete(bool complete) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_onboardingKey, complete);
    onboardingComplete.value = complete;
  }

  static Future<void> setBaseUrl(String url) async {
    final finalUrl = normalizeBaseUrl(url);

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_storageKey, finalUrl);
    baseUrl.value = finalUrl;
  }

  static Future<void> reset() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_storageKey);
    baseUrl.value = _defaultUrl;
  }

  /// Waits for the backend to start up by polling the /health endpoint.
  /// Uses a simple exponential backoff strategy.
  static Future<void> waitForBackend({
    int maxAttempts = 30,
    Duration initialDelay = const Duration(seconds: 1),
  }) async {
    if (bypassWaitForBackend) {
      debugPrint('Bypassing backend wait for testing');
      return;
    }

    final client = http.Client();
    Duration currentDelay = initialDelay;

    final uri = buildHealthUri(baseUrl.value);

    try {
      for (int attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          final response = await client
              .get(uri)
              .timeout(const Duration(seconds: 5));

          if (response.statusCode == 200) {
            debugPrint('Backend is awake after $attempt attempts');
            return;
          }
        } catch (e) {
          debugPrint(
            'Backend not awake yet (attempt $attempt/$maxAttempts): $e',
          );
        }

        if (attempt < maxAttempts) {
          await Future<void>.delayed(currentDelay);
          // Simple backoff: double the delay up to a maximum of 5 seconds
          currentDelay = Duration(
            milliseconds: (currentDelay.inMilliseconds * 1.5)
                .clamp(initialDelay.inMilliseconds, 5000)
                .toInt(),
          );
        }
      }

      throw Exception('Failed to reach backend after $maxAttempts attempts');
    } finally {
      client.close();
    }
  }

  @visibleForTesting
  static String normalizeBaseUrl(String url) {
    final trimmed = url.trim();
    if (trimmed.isEmpty) {
      throw const FormatException('Backend URL cannot be empty.');
    }

    final uri = Uri.tryParse(trimmed);
    if (uri == null || !uri.hasScheme || uri.host.isEmpty) {
      throw const FormatException(
        'Backend URL must be an absolute http(s) URL.',
      );
    }
    if (uri.scheme != 'http' && uri.scheme != 'https') {
      throw FormatException(
        'Backend URL must use http or https, got ${uri.scheme}.',
      );
    }
    if (uri.userInfo.isNotEmpty) {
      throw const FormatException(
        'Backend URL must not include embedded credentials.',
      );
    }
    if (uri.hasQuery || uri.fragment.isNotEmpty) {
      throw const FormatException(
        'Backend URL must not include a query string or fragment.',
      );
    }

    final pathSegments = uri.pathSegments
        .where((segment) => segment.isNotEmpty)
        .toList();
    final normalizedSegments = _normalizeApiPath(pathSegments);
    final normalizedUri = uri.replace(pathSegments: normalizedSegments);

    final normalized = normalizedUri.toString();
    return normalized.endsWith('/')
        ? normalized.substring(0, normalized.length - 1)
        : normalized;
  }

  @visibleForTesting
  static Uri buildHealthUri(String url) {
    final uri = Uri.parse(normalizeBaseUrl(url));
    final pathSegments = uri.pathSegments
        .where((segment) => segment.isNotEmpty)
        .toList();
    final healthSegments = List<String>.from(pathSegments);

    if (healthSegments.length >= 2 &&
        healthSegments[healthSegments.length - 2] == 'api' &&
        healthSegments.last == 'v1') {
      healthSegments.removeLast();
      healthSegments.removeLast();
    }
    healthSegments.add('health');

    return uri.replace(pathSegments: healthSegments);
  }

  static String _resolveDefaultUrl() {
    try {
      return normalizeBaseUrl(_azureUrl);
    } on FormatException catch (error) {
      debugPrint('Invalid BACKEND_URL configuration: ${error.message}');
      return normalizeBaseUrl(_fallbackUrl);
    }
  }

  static List<String> _normalizeApiPath(List<String> pathSegments) {
    if (pathSegments.length >= 2 &&
        pathSegments[pathSegments.length - 2] == 'api' &&
        pathSegments.last == 'v1') {
      return pathSegments;
    }
    if (pathSegments.isNotEmpty && pathSegments.last == 'api') {
      return [...pathSegments, 'v1'];
    }
    return [...pathSegments, 'api', 'v1'];
  }
}
