import 'dart:developer';

import 'package:az_notification_hub/az_notification_hub.dart';

class NotificationService {
  static Future<void> initStatic(
    String hubName,
    String connectionString,
  ) async {
    if (hubName.isEmpty || connectionString.isEmpty) {
      log('Notification hub config empty. Skipping.');
      return;
    }
    try {
      await AzureNotificationHub.instance.startWithHubInfo(
        connectionString,
        hubName,
      );
      log('Notification hub initialized.');
    } catch (e, s) {
      log('Failed to init notification hub', error: e, stackTrace: s);
      rethrow;
    }
  }

  static Future<void> registerStatic(List<String> tags) async {
    try {
      final success = await AzureNotificationHub.instance.addTags(tags);
      if (success) {
        log(
          'Successfully registered with Notification Hub: tags count=${tags.length}',
        );
      } else {
        log('Failed to register with Notification Hub.');
      }
    } catch (e, s) {
      log('Error registering with Notification Hub', error: e, stackTrace: s);
      rethrow;
    }
  }

  static Future<void> unregisterStatic() async {
    try {
      await AzureNotificationHub.instance.clearTags();
      log('Successfully unregistered from Notification Hub.');
    } catch (e, s) {
      log('Error unregistering from Notification Hub', error: e, stackTrace: s);
      rethrow;
    }
  }
}
