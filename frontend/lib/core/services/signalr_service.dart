import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:signalr_netcore/signalr_client.dart';
import 'package:miru/core/api/api_service.dart';

class SignalRService {
  HubConnection? _hubConnection;

  final _messageController = StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get onMessage => _messageController.stream;

  static final SignalRService instance = SignalRService._internal();

  SignalRService._internal();

  Future<void> initialize() async {
    try {
      final negotiateInfo = await ApiService.instance.negotiateSignalR();

      final url = negotiateInfo['url'] as String;
      final accessToken = negotiateInfo['accessToken'] as String;

      _hubConnection = HubConnectionBuilder()
          .withUrl(
            url,
            options: HttpConnectionOptions(
              accessTokenFactory: () async => accessToken,
            ),
          )
          .withAutomaticReconnect()
          .build();

      _hubConnection?.onclose(({error}) {
        debugPrint('SignalR connection closed: $error');
      });

      _hubConnection?.on('message', _handleMessage);

      await _hubConnection?.start();
      debugPrint('SignalR connected.');
    } catch (e) {
      debugPrint('Error initializing SignalR: $e');
    }
  }

  void _handleMessage(List<Object?>? parameters) {
    if (parameters == null || parameters.isEmpty) return;

    try {
      final payload = parameters[0] as Map<String, dynamic>;
      _messageController.add(payload);
    } catch (e) {
      debugPrint('Error parsing SignalR message: $e');
    }
  }

  Future<void> sendMessage(String message) async {
    if (_hubConnection?.state != HubConnectionState.Connected) {
      debugPrint('SignalR not connected. Cannot send message.');
      return;
    }
    try {
      await _hubConnection?.invoke('SendMessage', args: [message]);
    } catch (e) {
      debugPrint('Error sending SignalR message: $e');
      rethrow;
    }
  }

  Future<void> dispose() async {
    await _messageController.close();
    await _hubConnection?.stop();
    _hubConnection = null;
  }
}
