import 'dart:async';

import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:miru/core/api/api_service.dart';
import 'package:miru/core/design_system/design_system.dart';
import 'package:miru/core/models/chat_message.dart';
import 'package:miru/core/models/message_status.dart';
import 'package:miru/features/settings/pages/settings_page.dart';

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

    final stream = ApiService.sendMessage(text);
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
          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500),
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
      appBar: _MiruAppBar(
        colors: colors,
        isDark: isDark,
        showNewChat: _messages.isNotEmpty,
        onNewChat: _newChat,
        onSettingsPressed: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => SettingsPage(onClearHistory: _newChat),
            ),
          );
        },
      ),
      extendBodyBehindAppBar: true,
      body: Stack(
        children: [
          // Message list
          _messages.isEmpty
              ? Padding(
                  padding: EdgeInsets.only(
                    top: kToolbarHeight + MediaQuery.paddingOf(context).top,
                  ),
                  child: AppEmptyState(
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
                  ),
                )
              : Padding(
                  padding: EdgeInsets.only(
                    top: kToolbarHeight + MediaQuery.paddingOf(context).top,
                    // Give enough bottom padding for the floating input bar
                    bottom: 120,
                  ),
                  child: _MessageList(
                    messages: _messages,
                    scrollController: _scrollController,
                    isStreaming: _isStreaming,
                    streamingStatus: _streamingStatus,
                    onCopy: _copyMessage,
                    onRetry: _retryLastMessage,
                  ),
                ),

          // Scroll-to-bottom FAB
          if (_showScrollToBottom && _messages.isNotEmpty)
            Positioned(
              bottom: 120,
              right: AppSpacing.lg,
              child: _ScrollToBottomButton(
                onPressed: _scrollToBottom,
                colors: colors,
              ),
            ),

          // Bottom floating area
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (_isStreaming && _streamingStatus != null)
                  _StreamingStatusPill(label: _streamingStatus!),
                ChatInputBar(
                  controller: _inputController,
                  focusNode: _inputFocusNode,
                  onSend: _sendMessage,
                  isStreaming: _isStreaming,
                  onStopStreaming: _stopGeneration,
                ),
              ],
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

// ---------------------------------------------------------------------------
// Message list
// ---------------------------------------------------------------------------

class _MessageList extends StatelessWidget {
  final List<ChatMessage> messages;
  final ScrollController scrollController;
  final bool isStreaming;
  final String? streamingStatus;
  final void Function(ChatMessage) onCopy;
  final VoidCallback onRetry;

  const _MessageList({
    required this.messages,
    required this.scrollController,
    required this.isStreaming,
    required this.streamingStatus,
    required this.onCopy,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      controller: scrollController,
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.lg,
      ),
      itemCount: messages.length,
      itemBuilder: (context, index) {
        final msg = messages[index];

        // Show streaming status label in the placeholder bubble while we're
        // waiting for the first token.
        final isPlaceholder =
            !msg.isUser && msg.text.isEmpty && streamingStatus != null;

        return _AnimatedMessageItem(
          key: ValueKey(msg.id),
          child: ChatBubble(
            text: isPlaceholder ? streamingStatus! : msg.text,
            isUser: msg.isUser,
            crewTaskType: msg.crewTaskType,
            status: isPlaceholder ? MessageStatus.streaming : msg.status,
            onCopy: () => onCopy(msg),
            onRetry: msg.status == MessageStatus.failed ? onRetry : null,
          ),
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Animated message item — slides + fades in
// ---------------------------------------------------------------------------

class _AnimatedMessageItem extends StatefulWidget {
  final Widget child;

  const _AnimatedMessageItem({super.key, required this.child});

  @override
  State<_AnimatedMessageItem> createState() => _AnimatedMessageItemState();
}

class _AnimatedMessageItemState extends State<_AnimatedMessageItem>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _opacity;
  late final Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: AppDurations.medium,
    );
    _opacity = CurvedAnimation(parent: _controller, curve: Curves.easeOut);
    _slide = Tween<Offset>(
      begin: const Offset(0, 0.06),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic));
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _opacity,
      child: SlideTransition(position: _slide, child: widget.child),
    );
  }
}

// ---------------------------------------------------------------------------
// Streaming status pill
// ---------------------------------------------------------------------------

class _StreamingStatusPill extends StatefulWidget {
  final String label;

  const _StreamingStatusPill({required this.label});

  @override
  State<_StreamingStatusPill> createState() => _StreamingStatusPillState();
}

class _StreamingStatusPillState extends State<_StreamingStatusPill>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulse;
  late final Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    _pulse = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);
    _opacity = Tween<double>(
      begin: 0.5,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _pulse, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final isDark = context.isDark;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: FadeTransition(
        opacity: _opacity,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.md,
                vertical: AppSpacing.xs,
              ),
              decoration: BoxDecoration(
                color:
                    (isDark
                            ? AppColors.surfaceHighDark
                            : AppColors.surfaceHighLight)
                        .withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
                border: Border.all(
                  color: colors.border.withValues(alpha: 0.4),
                  width: 1,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    width: 10,
                    height: 10,
                    child: CircularProgressIndicator(
                      strokeWidth: 1.5,
                      valueColor: AlwaysStoppedAnimation<Color>(colors.primary),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.xs),
                  Text(
                    widget.label,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: colors.onSurfaceMuted,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Scroll to bottom button
// ---------------------------------------------------------------------------

class _ScrollToBottomButton extends StatelessWidget {
  final VoidCallback onPressed;
  final AppThemeColors colors;

  const _ScrollToBottomButton({required this.onPressed, required this.colors});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: colors.surfaceHigh,
      elevation: 4,
      shadowColor: Colors.black.withValues(alpha: 0.15),
      shape: const CircleBorder(),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onPressed,
        child: Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: colors.border.withValues(alpha: 0.6)),
          ),
          child: Icon(
            Icons.keyboard_arrow_down_rounded,
            color: colors.onSurfaceMuted,
            size: AppSpacing.iconMd,
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Premium App Bar
// ---------------------------------------------------------------------------

class _MiruAppBar extends StatelessWidget implements PreferredSizeWidget {
  final AppThemeColors colors;
  final bool isDark;
  final bool showNewChat;
  final VoidCallback onNewChat;
  final VoidCallback onSettingsPressed;

  const _MiruAppBar({
    required this.colors,
    required this.isDark,
    required this.showNewChat,
    required this.onNewChat,
    required this.onSettingsPressed,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    // Gradient uses design tokens instead of hardcoded colors.
    final gradientColors = isDark
        ? [AppColors.onSurfaceDark, AppColors.primaryLight]
        : [AppColors.onSurfaceLight, AppColors.primaryDark];

    return AppBar(
      backgroundColor:
          (isDark ? AppColors.backgroundDark : AppColors.backgroundLight)
              .withValues(alpha: 0.65),
      flexibleSpace: ClipRect(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
          child: Container(color: Colors.transparent),
        ),
      ),
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: true,
      leading: showNewChat
          ? IconButton(
              icon: Icon(
                Icons.add_rounded,
                color: colors.onSurfaceMuted,
                size: 22,
              ),
              tooltip: 'New chat',
              onPressed: onNewChat,
            )
          : null,
      title: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Icon mark
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              color: colors.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.blur_on_rounded, size: 16, color: colors.primary),
          ),
          const SizedBox(width: AppSpacing.sm),
          // Gradient wordmark
          ShaderMask(
            shaderCallback: (bounds) => LinearGradient(
              colors: gradientColors,
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ).createShader(bounds),
            child: Text(
              'Miru',
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: Colors.white,
                letterSpacing: -0.5,
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.xs),
          const AppStatusDot.online(),
        ],
      ),
      actions: [
        IconButton(
          icon: Icon(
            Icons.settings_outlined,
            color: colors.onSurfaceMuted,
            size: 22,
          ),
          onPressed: onSettingsPressed,
          tooltip: 'Settings',
        ),
        const SizedBox(width: AppSpacing.xs),
      ],
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(
          height: 1,
          color: (isDark ? AppColors.borderDark : AppColors.borderLight)
              .withValues(alpha: 0.4),
        ),
      ),
    );
  }
}
