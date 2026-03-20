import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:miru/core/api/api_service.dart';
import 'package:miru/core/design_system/design_system.dart';
import 'package:miru/core/models/chat_message.dart';
import 'package:miru/core/models/message_status.dart';
import 'package:miru/features/chat/widgets/miru_app_bar.dart';
import 'package:miru/features/chat/widgets/scroll_to_bottom_button.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:miru/features/chat/widgets/streaming_status_pill.dart';
import 'package:miru/features/chat/widgets/message_list.dart';

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

/// The main chat screen of the Miru app.
class ChatPage extends StatefulWidget {
  const ChatPage({super.key});

  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final List<ChatMessage> _messages = [];
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _inputFocusNode = FocusNode();

  bool _isStreaming = false;
  bool _showScrollToBottom = false;

  /// Human-readable status shown while the assistant is processing.
  String? _streamingStatus;

  /// Active stream subscription for cancellation support.
  StreamSubscription<String>? _activeStreamSubscription;

  static const String _messagesKey = 'miru_chat_messages';

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _loadMessages();
    // Auto-focus the input field on load.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _inputFocusNode.requestFocus();
    });
  }

  Future<void> _handleFeedback(ChatMessage message, bool isPositive) async {
    try {
      await ApiService.instance.submitFeedback(message.id, isPositive);
      if (!mounted) return;

      // Update local message state to reflect feedback
      setState(() {
        final index = _messages.indexWhere((m) => m.id == message.id);
        if (index != -1) {
          _messages[index] = _messages[index].copyWith(
            feedback: isPositive ? 'positive' : 'negative',
          );
        }
      });

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Thanks for the feedback!')));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Failed to submit feedback')));
    }
  }

  // ---------------------------------------------------------------------------
  // Persistence
  // ---------------------------------------------------------------------------

  Future<void> _loadMessages() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonString = prefs.getString(_messagesKey);
    if (jsonString != null && jsonString.isNotEmpty) {
      try {
        final loaded = ChatMessage.decodeList(jsonString);
        // Filter out streaming/sending messages from a previous session.
        final restored = loaded
            .where(
              (m) =>
                  m.status != MessageStatus.streaming &&
                  m.status != MessageStatus.sending,
            )
            .toList();
        if (restored.isNotEmpty) {
          setState(() => _messages.addAll(restored));
          _scrollToBottom(animate: false);
        }
      } catch (_) {
        // Corrupted data -- ignore.
      }
    }
  }

  Future<void> _saveMessages() async {
    final prefs = await SharedPreferences.getInstance();
    // Only persist sent and failed messages (not transient states).
    final toPersist = _messages
        .where(
          (m) =>
              m.status == MessageStatus.sent ||
              m.status == MessageStatus.failed,
        )
        .toList();
    await prefs.setString(_messagesKey, ChatMessage.encodeList(toPersist));
  }

  // ---------------------------------------------------------------------------
  // Scroll management
  // ---------------------------------------------------------------------------

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final isAtBottom =
        _scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 80;
    if (_showScrollToBottom == isAtBottom) {
      setState(() => _showScrollToBottom = !isAtBottom);
    }
  }

  void _scrollToBottom({bool animate = true}) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        if (animate) {
          _scrollController.animateTo(
            _scrollController.position.maxScrollExtent,
            duration: AppDurations.fast,
            curve: AppDurations.enterCurve,
          );
        } else {
          _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  Future<void> _sendMessage() async {
    final text = _inputController.text.trim();
    if (text.isEmpty || _isStreaming) return;

    _inputController.clear();
    _inputFocusNode.requestFocus();

    setState(() {
      _messages.add(ChatMessage.user(text));
      _messages.add(ChatMessage.assistantPlaceholder());
      _isStreaming = true;
    });
    _scrollToBottom();
    HapticFeedback.lightImpact();

    try {
      await _sendStreamingMessage(text);
    } catch (e) {
      // Don't overwrite if already cancelled.
      if (_messages.isNotEmpty) {
        setState(() {
          final lastIndex = _messages.length - 1;
          if (_messages[lastIndex].status != MessageStatus.sent) {
            _messages[lastIndex] = _messages[lastIndex].copyWith(
              text: _messages[lastIndex].text.isEmpty
                  ? 'Error: $e'
                  : _messages[lastIndex].text,
              status: MessageStatus.failed,
            );
          }
        });
      }
    } finally {
      _activeStreamSubscription = null;
      setState(() {
        _isStreaming = false;
        _streamingStatus = null;
      });
      unawaited(_saveMessages());
    }
  }

  /// Streams a response from the backend, handling [[STATUS:...]] events.
  Future<void> _sendStreamingMessage(String text) async {
    final statusRegex = RegExp(r'\[\[STATUS:([^\]]+)\]\]');

    final prefs = await SharedPreferences.getInstance();
    final stylePref = prefs.getString('miru_chat_style');
    final stream = ApiService.instance.sendMessage(
      text,
      stylePreference: stylePref,
    );
    _activeStreamSubscription = stream.listen(
      (chunk) {
        if (!mounted) return;

        // Handle status events.
        final statusMatch = statusRegex.firstMatch(chunk);
        if (statusMatch != null) {
          final payload = statusMatch.group(1)!;
          setState(() => _streamingStatus = _statusLabel(payload));
          return;
        }

        // Regular text chunk — clear status and append to the reply.
        setState(() {
          _streamingStatus = null;
          final lastIndex = _messages.length - 1;
          _messages[lastIndex] = _messages[lastIndex].copyWith(
            text: _messages[lastIndex].text + chunk,
            status: MessageStatus.streaming,
          );
        });
        _scrollToBottom();
      },
      onDone: () {
        if (!mounted) return;
        setState(() {
          _streamingStatus = null;
          final lastIndex = _messages.length - 1;
          if (_messages[lastIndex].status == MessageStatus.streaming) {
            _messages[lastIndex] = _messages[lastIndex].copyWith(
              status: MessageStatus.sent,
            );
          }
        });
        HapticFeedback.mediumImpact();
      },
    );

    // Await the subscription completing.
    await _activeStreamSubscription!.asFuture<void>();
  }

  /// Maps a raw backend status payload to a human-readable label.
  String? _statusLabel(String payload) {
    switch (payload) {
      case 'retrieving_memories':
        return 'Recalling memories...';
      case 'thinking':
        return 'Thinking...';
      case 'done':
        return null;
      default:
        return null;
    }
  }

  /// Stop the current streaming response.
  void _stopGeneration() {
    _activeStreamSubscription?.cancel();
    _activeStreamSubscription = null;
    setState(() {
      _isStreaming = false;
      _streamingStatus = null;
      final lastIndex = _messages.length - 1;
      if (lastIndex >= 0 &&
          !_messages[lastIndex].isUser &&
          _messages[lastIndex].status == MessageStatus.streaming) {
        _messages[lastIndex] = _messages[lastIndex].copyWith(
          status: MessageStatus.sent,
        );
      }
    });
    unawaited(_saveMessages());
  }

  /// Retry the last failed message.
  void _retryLastMessage() {
    if (_messages.length < 2) return;

    // Find the user message that preceded the failed assistant message.
    final failedIndex = _messages.length - 1;
    if (!_messages[failedIndex].isUser &&
        _messages[failedIndex].status == MessageStatus.failed) {
      // Remove the failed response.
      setState(() => _messages.removeAt(failedIndex));

      // Find the last user message and resend.
      for (int i = _messages.length - 1; i >= 0; i--) {
        if (_messages[i].isUser) {
          _inputController.text = _messages[i].text;
          // Remove the original user message too -- _sendMessage will re-add it.
          setState(() => _messages.removeAt(i));
          _sendMessage();
          break;
        }
      }
    }
  }

  /// Clear all messages and start a new conversation.
  void _newChat() {
    if (_isStreaming) _stopGeneration();
    setState(() => _messages.clear());
    _inputFocusNode.requestFocus();
    unawaited(_saveMessages());
  }

  /// Copy message text to clipboard.
  void _copyMessage(ChatMessage msg) {
    Clipboard.setData(ClipboardData(text: msg.text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Copied to clipboard',
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w500),
        ),
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        ),
        margin: const EdgeInsets.all(AppSpacing.lg),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final isDark = context.isDark;

    return Scaffold(
      backgroundColor: colors.background,
      appBar: MiruAppBar(
        colors: colors,
        isDark: isDark,
        showNewChat: _messages.isNotEmpty,
        onNewChat: _newChat,
        onSettingsPressed: null,
      ),
      body: Stack(
        children: [
          Column(
            children: [
              // Message list
              Expanded(
                child: _messages.isEmpty
                    ? AppEmptyState(
                        title: "Hi, I'm Miru.",
                        subtitle:
                            'I remember things about you over time.\nTell me something!',
                        suggestions: const [
                          'What can you help me with?',
                          'Summarize a topic for me',
                          'Tell me something interesting',
                          'Help me brainstorm ideas',
                        ],
                        onSuggestionTap: (text) {
                          _inputController.text = text;
                          _sendMessage();
                        },
                      )
                    : MessageList(
                        messages: _messages,
                        scrollController: _scrollController,
                        isStreaming: _isStreaming,
                        streamingStatus: _streamingStatus,
                        onCopy: _copyMessage,
                        onRetry: _retryLastMessage,
                        onFeedback: _handleFeedback,
                      ),
              ),

              // Streaming status pill (shown above input bar)
              if (_isStreaming && _streamingStatus != null)
                StreamingStatusPill(label: _streamingStatus!),

              // Input bar
              ChatInputBar(
                controller: _inputController,
                focusNode: _inputFocusNode,
                onSend: _sendMessage,
                isStreaming: _isStreaming,
                onStopStreaming: _stopGeneration,
              ),
            ],
          ),

          // Scroll-to-bottom FAB
          Positioned(
            bottom: 100,
            right: AppSpacing.lg,
            child: AnimatedOpacity(
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeInOut,
              opacity: (_showScrollToBottom && _messages.isNotEmpty)
                  ? 1.0
                  : 0.0,
              child: AnimatedScale(
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeInOut,
                scale: (_showScrollToBottom && _messages.isNotEmpty)
                    ? 1.0
                    : 0.8,
                child: IgnorePointer(
                  ignoring: !(_showScrollToBottom && _messages.isNotEmpty),
                  child: ScrollToBottomButton(
                    onPressed: _scrollToBottom,
                    colors: colors,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _activeStreamSubscription?.cancel();
    _inputController.dispose();
    _scrollController
      ..removeListener(_onScroll)
      ..dispose();
    _inputFocusNode.dispose();
    super.dispose();
  }
}
