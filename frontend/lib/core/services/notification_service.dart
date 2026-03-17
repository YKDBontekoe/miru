import 'dart:developer';

import 'package:az_notification_hub/az_notification_hub.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class NotificationService {
  NotificationService();

  static Future<void> initStatic(
    String hubName,
    String connectionString,
  ) async {
    if (hubName.isEmpty || connectionString.isEmpty) {
      log('Notification hub config empty. Skipping.');
      return;
    }
    try {
      await AzureNotificationHub.instance.startWithHubInfo(connectionString, hubName);
      log('Notification hub initialized.');
    } catch (e, s) {
      log('Failed to init notification hub', error: e, stackTrace: s);
    }
  }

  static Future<void> registerStatic(List<String> tags) async {
    try {
      final success = await AzureNotificationHub.instance.addTags(tags);
      if (success) {
        log('Successfully registered with Notification Hub: tags=$tags');
      } else {
        log('Failed to register with Notification Hub.');
      }
    } catch (e, s) {
      log('Error registering with Notification Hub', error: e, stackTrace: s);
    }
  }

  static Future<void> unregisterStatic() async {
    try {
      await AzureNotificationHub.instance.clearTags();
      log('Successfully unregistered from Notification Hub.');
    } catch (e, s) {
      log('Error unregistering from Notification Hub', error: e, stackTrace: s);
    }
  }

  Future<void> init(String hubName, String connectionString) async {
    return initStatic(hubName, connectionString);
  }

  Future<void> register(List<String> tags) async {
    return registerStatic(tags);
  }

  Future<void> unregister() async {
    return unregisterStatic();
  }
}

final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService();
});
