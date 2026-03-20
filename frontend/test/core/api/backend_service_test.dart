import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:miru/core/api/backend_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    BackendService.baseUrl.value = BackendService.normalizeBaseUrl(
      'https://example.com/api/v1',
    );
  });

  test('normalizeBaseUrl appends api version when missing', () {
    expect(
      BackendService.normalizeBaseUrl('https://example.com'),
      'https://example.com/api/v1',
    );
    expect(
      BackendService.normalizeBaseUrl('https://example.com/custom/api'),
      'https://example.com/custom/api/v1',
    );
  });

  test('normalizeBaseUrl rejects credentials and non-http schemes', () {
    expect(
      () => BackendService.normalizeBaseUrl(
        'postgresql://user:secret@db.example.com:5432/miru',
      ),
      throwsFormatException,
    );
    expect(
      () => BackendService.normalizeBaseUrl(
        'https://user:secret@example.com/api/v1',
      ),
      throwsFormatException,
    );
  });

  test('init ignores invalid saved backend URL', () async {
    SharedPreferences.setMockInitialValues({
      'miru_backend_url': 'postgresql://user:secret@db.example.com:5432/miru',
    });

    await BackendService.init();

    expect(BackendService.baseUrl.value, isNot(contains('postgresql://')));
    expect(BackendService.baseUrl.value, startsWith('https://'));
  });

  test('buildHealthUri points at health endpoint root', () {
    expect(
      BackendService.buildHealthUri('https://example.com/api/v1').toString(),
      'https://example.com/health',
    );
    expect(
      BackendService.buildHealthUri(
        'https://example.com/custom/api/v1',
      ).toString(),
      'https://example.com/custom/health',
    );
  });
}
