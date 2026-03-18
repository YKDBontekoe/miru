import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:signalr_netcore/signalr_client.dart';
import 'package:miru/core/api/api_service.dart';

class SignalRService {
  HubConnection? _hubConnection;

  final _messageController = StreamController<Map<String, dynamic>>.broadcast();
  Completer<void>? _connectCompleter;

  Stream<Map<String, dynamic>> get onMessage => _messageController.stream;

  bool get isConnected => _hubConnection?.state == HubConnectionState.Connected;
  Future<void> get connectDone => _connectCompleter?.future ?? Future.value();

  static final SignalRService instance = SignalRService._internal();

  SignalRService._internal();

  Future<void> initialize() async {
    if (_connectCompleter != null && !_connectCompleter!.isCompleted) {
      return _connectCompleter!.future;
    }
    _connectCompleter = Completer<void>();

    try {
      final negotiateInfo = await ApiService.instance.negotiateSignalR();

      final url = negotiateInfo['url'] as String;

      _hubConnection = HubConnectionBuilder()
          .withUrl(
            url,
            options: HttpConnectionOptions(
              accessTokenFactory: () async {
                final info = await ApiService.instance.negotiateSignalR();
                return info['accessToken'] as String;
              },
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
      _connectCompleter?.complete();
    } catch (e) {
      debugPrint('Error initializing SignalR: $e');
      _connectCompleter?.completeError(e);
      rethrow;
    }
  }

  void _handleMessage(List<Object?>? parameters) {
    if (parameters == null || parameters.isEmpty) return;

    final param = parameters[0];
    if (param is Map<String, dynamic>) {
      _messageController.add(param);
    } else if (param is String) {
      try {
        final decoded = jsonDecode(param);
        if (decoded is Map<String, dynamic>) {
          _messageController.add(decoded);
        }
      } catch (e) {
        debugPrint('Failed to decode SignalR string payload: $e');
      }
    } else {
      debugPrint(
        'Unexpected SignalR payload type: ${param.runtimeType} -> $param',
      );
    }
  }

  Future<void> sendMessage(String message) async {
    if (!isConnected) {
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
    _connectCompleter = null;
  }
}
