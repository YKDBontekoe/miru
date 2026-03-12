import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class BackendService {
  static const String _storageKey = 'miru_backend_url';
  static const String _onboardingKey = 'miru_onboarding_complete';

  static const String _azureUrl =
      'https://aca-miru.whitefield-4145d509.westeurope.azurecontainerapps.io/api/v1';

  static String get _defaultUrl => _azureUrl;

  static final ValueNotifier<String> baseUrl = ValueNotifier(_defaultUrl);
  static final ValueNotifier<bool> onboardingComplete = ValueNotifier(false);

  // A visible-for-testing flag to bypass the backend wait in tests
  @visibleForTesting
  static bool bypassWaitForBackend = false;

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();

    final savedUrl = prefs.getString(_storageKey);
    if (savedUrl != null) {
      baseUrl.value = savedUrl;
    }

    onboardingComplete.value = prefs.getBool(_onboardingKey) ?? false;
  }

  static Future<void> setOnboardingComplete(bool complete) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_onboardingKey, complete);
    onboardingComplete.value = complete;
  }

  static Future<void> setBaseUrl(String url) async {
    // Basic validation — ensure it starts with http/https
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw Exception('Invalid URL format');
    }

    // Strip trailing slash for consistency
    final sanitized =
        url.endsWith('/') ? url.substring(0, url.length - 1) : url;

    // Append /api/v1 if not present
    String finalUrl = sanitized;
    if (!sanitized.endsWith('/api/v1')) {
      if (sanitized.endsWith('/api')) {
        finalUrl = '$sanitized/v1';
      } else {
        finalUrl = '$sanitized/api/v1';
      }
    }

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

    // The health endpoint is at the root, so we strip /api/v1
    final uri =
        Uri.parse(baseUrl.value.replaceAll(RegExp(r'/api/v1$'), '/health'));

    try {
      for (int attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          final response = await client.get(uri).timeout(
                const Duration(seconds: 5),
              );

          if (response.statusCode == 200) {
            debugPrint('Backend is awake after $attempt attempts');
            return;
          }
        } catch (e) {
          debugPrint(
              'Backend not awake yet (attempt $attempt/$maxAttempts): $e');
        }

        if (attempt < maxAttempts) {
          await Future<void>.delayed(currentDelay);
          // Simple backoff: double the delay up to a maximum of 5 seconds
          currentDelay = Duration(
            milliseconds: (currentDelay.inMilliseconds * 1.5)
                .clamp(
                  initialDelay.inMilliseconds,
                  5000,
                )
                .toInt(),
          );
        }
      }

      throw Exception('Failed to reach backend after $maxAttempts attempts');
    } finally {
      client.close();
    }
  }
}
