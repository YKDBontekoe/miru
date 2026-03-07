import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class BackendService {
  static const String _storageKey = 'miru_backend_url';
  static const String _onboardingKey = 'miru_onboarding_complete';

  static const String _azureUrl =
      'https://aca-miru.whitefield-4145d509.westeurope.azurecontainerapps.io/api';

  static String get _defaultUrl => _azureUrl;

  static final ValueNotifier<String> baseUrl = ValueNotifier(_defaultUrl);
  static final ValueNotifier<bool> onboardingComplete = ValueNotifier(false);

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
    final sanitized = url.endsWith('/') ? url.substring(0, url.length - 1) : url;

    // Append /api if not present
    final finalUrl = sanitized.endsWith('/api') ? sanitized : '$sanitized/api';

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_storageKey, finalUrl);
    baseUrl.value = finalUrl;
  }

  static Future<void> reset() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_storageKey);
    baseUrl.value = _defaultUrl;
  }
}
