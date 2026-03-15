import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:confetti/confetti.dart';

import 'package:miru/core/api/api_service.dart';
import 'package:miru/core/design_system/design_system.dart';
import 'package:miru/core/models/agent.dart';
import 'package:miru/core/models/message_status.dart';
import 'package:miru/core/models/chat_message.dart';
import 'package:miru/features/rooms/widgets/message_item.dart';
import 'package:miru/features/rooms/widgets/streaming_bubble.dart';
import 'package:miru/features/rooms/widgets/add_agent_sheet.dart';
import 'package:miru/core/models/chat_room.dart';

class GroupChatPage extends StatefulWidget {
  final ChatRoom room;
  const GroupChatPage({super.key, required this.room});

  @override
  State<GroupChatPage> createState() => _GroupChatPageState();
}

class _GroupChatPageState extends State<GroupChatPage> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  late String _roomName;
  List<ChatMessage> _messages = [];
  List<Agent> _roomAgents = [];
  bool _isLoading = true;
  bool _isSending = false;

  // Tracks per-agent streaming messages keyed by agent ID.
  final Map<String, String> _streamingBuffers = {};

  // Human-readable status shown while agents are processing.
  String? _streamingStatus;

  late final ConfettiController _confettiController;

  @override
  void initState() {
    super.initState();
    _roomName = widget.room.name;
    _confettiController = ConfettiController(
      duration: const Duration(seconds: 2),
    );
    _loadData();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    _confettiController.dispose();
    super.dispose();
  }

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        ApiService.getRoomAgents(widget.room.id),
        ApiService.getRoomMessages(widget.room.id),
      ]);

      if (!mounted) return;
      setState(() {
        _roomAgents = results[0] as List<Agent>;
        _messages = results[1] as List<ChatMessage>;
      });
      _scrollToBottom();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error loading chat: $e'),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _scrollToBottom({bool animated = true}) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      if (animated) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      } else {
        _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Sending
  // ---------------------------------------------------------------------------

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _isSending) return;

    _messageController.clear();

    // Optimistically add user message.
    setState(() {
      _messages.add(ChatMessage.user(text));
      _isSending = true;
      _streamingBuffers.clear();
      _streamingStatus = null;
    });
    _scrollToBottom();
    HapticFeedback.lightImpact();

    try {
      final stream = ApiService.streamRoomChat(widget.room.id, text);

      // Current agent being streamed — tracked via [[AGENT:id:name]] markers.
      String? activeAgentId;

      // Regex patterns for control events.
      final agentRegex = RegExp(r'\[\[AGENT:([^:]+):([^\]]+)\]\]');
      final statusRegex = RegExp(r'\[\[STATUS:([^\]]+)\]\]');

      await for (final chunk in stream) {
        if (!mounted) break;

        // Detect status events: [[STATUS:<kind>]] or [[STATUS:loading_agent:<id>:<name>]]
        final statusMatch = statusRegex.firstMatch(chunk);
        if (statusMatch != null) {
          final statusPayload = statusMatch.group(1)!;
          if (statusPayload.startsWith('level_up:')) {
            final parts = statusPayload.split(':');
            if (parts.length >= 3) {
              final agentId = parts[1];
              final level = parts[2];
              final agentName = _agentNameById(agentId);
              HapticFeedback.heavyImpact();
              _confettiController.play();
              setState(() {
                _messages.add(
                  ChatMessage(
                    id: DateTime.now().millisecondsSinceEpoch.toString(),
                    roomId: widget.room.id,
                    userId: null,
                    agentId: null, // System message conceptually
                    text:
                        '**Level up!** You reached Connection Level $level with $agentName.',
                    timestamp: DateTime.now(),
                    status: MessageStatus.sent,
                  ),
                );
              });
              _scrollToBottom();
            }
            continue;
          }
          setState(() {
            activeAgentId = null; // status events reset active streaming agent
            _streamingStatus = _statusLabel(statusPayload);
          });
          continue;
        }

        // Detect agent-switch markers: [[AGENT:<id>:<name>]]
        final agentMatch = agentRegex.firstMatch(chunk);
        if (agentMatch != null) {
          final matchedId = agentMatch.group(1);
          if (matchedId != null) {
            activeAgentId = matchedId;
            if (!_streamingBuffers.containsKey(activeAgentId)) {
              _streamingBuffers[activeAgentId!] = '';
            }
          }
          setState(() => _streamingStatus = null);
          continue;
        }

        if (activeAgentId != null) {
          setState(() {
            _streamingBuffers[activeAgentId!] =
                (_streamingBuffers[activeAgentId] ?? '') + chunk;
          });
          _scrollToBottom();
        }
      }

      // Reload persisted messages once streaming finishes.
      await _loadData();
      HapticFeedback.mediumImpact();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to send: $e'),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSending = false;
          _streamingBuffers.clear();
          _streamingStatus = null;
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Room actions
  // ---------------------------------------------------------------------------

  Future<void> _renameRoom() async {
    final controller = TextEditingController(text: _roomName);
    final newName = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Rename Group'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(hintText: 'Group name'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, controller.text.trim()),
            child: const Text('Save'),
          ),
        ],
      ),
    );

    if (newName != null && newName.isNotEmpty && newName != _roomName) {
      try {
        await ApiService.updateRoom(widget.room.id, newName);
        if (mounted) setState(() => _roomName = newName);
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Rename failed: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _showAddAgentDialog() async {
    try {
      final allAgentsData = await ApiService.getAgents();
      final allAgents = allAgentsData;

      if (!mounted) return;

      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (context) => AddAgentSheet(
          allAgents: allAgents,
          roomAgents: _roomAgents,
          onAdd: (agentId) async {
            await ApiService.addAgentToRoom(widget.room.id, agentId);
            await _loadData();
          },
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error loading personas: $e'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  String _getSenderName(ChatMessage msg) {
    if (msg.isUser) return 'You';
    if (msg.isAgent) {
      return _roomAgents
          .firstWhere(
            (a) => a.id == msg.agentId,
            orElse: () =>
                Agent(id: '', name: 'Agent', personality: '', createdAt: ''),
          )
          .name;
    }
    return 'Unknown';
  }

  String _agentNameById(String id) {
    return _roomAgents
        .firstWhere(
          (a) => a.id == id,
          orElse: () =>
              Agent(id: '', name: 'Agent', personality: '', createdAt: ''),
        )
        .name;
  }

  /// Maps a raw backend status payload to a human-readable label.
  String _statusLabel(String payload) {
    if (payload == 'retrieving_memories') return 'Recalling memories...';
    if (payload == 'orchestrating') return 'Deciding who speaks next...';
    if (payload.startsWith('glance:')) {
      return payload.substring('glance:'.length);
    }
    if (payload == 'done') return '';
    if (payload.startsWith('loading_agent:')) {
      final parts = payload.split(':');
      final name = parts.length >= 3 ? parts[2] : 'agent';
      return '$name is thinking...';
    }
    return '';
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Scaffold(
      backgroundColor: colors.background,
      appBar: _buildAppBar(colors),
      body: Stack(
        children: [
          Column(
            children: [
              _buildMembersBar(colors),
              Expanded(child: _buildMessageList(colors)),
              if (_isSending &&
                  (_streamingBuffers.isNotEmpty ||
                      (_streamingStatus != null &&
                          _streamingStatus!.isNotEmpty)))
                _buildStreamingBubbles(colors),
              ChatInputBar(
                controller: _messageController,
                onSend: _sendMessage,
                isStreaming: _isSending,
                onStopStreaming: null, // group chat doesn't support stop yet
                hintText: 'Message the group...',
              ),
            ],
          ),
          Align(
            alignment: Alignment.topCenter,
            child: ConfettiWidget(
              confettiController: _confettiController,
              blastDirectionality: BlastDirectionality.explosive,
              shouldLoop: false,
              colors: const [
                Colors.green,
                Colors.blue,
                Colors.pink,
                Colors.orange,
                Colors.purple,
              ],
            ),
          ),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(AppThemeColors colors) {
    return AppBar(
      backgroundColor: colors.surfaceHigh,
      elevation: 0,
      scrolledUnderElevation: 0,
      leading: IconButton(
        icon: Icon(Icons.arrow_back_ios_rounded, color: colors.onSurface),
        onPressed: () => Navigator.pop(context),
      ),
      title: GestureDetector(
        onTap: _renameRoom,
        behavior: HitTestBehavior.opaque,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(_roomName, style: AppTypography.headingSmall),
            const SizedBox(width: AppSpacing.xs),
            Icon(Icons.edit_outlined, size: 14, color: colors.onSurfaceMuted),
          ],
        ),
      ),
      actions: [
        IconButton(
          icon: Icon(Icons.person_add_alt_1_rounded, color: colors.onSurface),
          onPressed: _showAddAgentDialog,
          tooltip: 'Add persona',
        ),
        const SizedBox(width: AppSpacing.xs),
      ],
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(
          height: 1,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                colors.border.withValues(alpha: 0),
                colors.border.withValues(alpha: 0.6),
                colors.border.withValues(alpha: 0),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMembersBar(AppThemeColors colors) {
    final names = ['You', ..._roomAgents.map((a) => a.name)];
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.sm,
      ),
      color: colors.surfaceHigh,
      child: Row(
        children: [
          Icon(Icons.group_outlined, size: 14, color: colors.onSurfaceMuted),
          const SizedBox(width: AppSpacing.xs),
          Expanded(
            child: Text(
              names.join(', '),
              style: AppTypography.caption.copyWith(
                color: colors.onSurfaceMuted,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageList(AppThemeColors colors) {
    if (_isLoading && _messages.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_messages.isEmpty && !_isSending) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.chat_bubble_outline_rounded,
              size: 48,
              color: colors.onSurfaceMuted.withValues(alpha: 0.4),
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              'No messages yet',
              style: AppTypography.bodyMedium.copyWith(
                color: colors.onSurfaceMuted,
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              'Send a message to start the conversation',
              style: AppTypography.caption.copyWith(
                color: colors.onSurfaceMuted.withValues(alpha: 0.6),
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      padding: AppSpacing.chatListPadding,
      itemCount: _messages.length,
      itemBuilder: (context, index) {
        final msg = _messages[index];
        return MessageItem(message: msg, senderName: _getSenderName(msg));
      },
    );
  }

  Widget _buildStreamingBubbles(AppThemeColors colors) {
    final hasStatus = _streamingStatus != null && _streamingStatus!.isNotEmpty;
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.xs,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (hasStatus) StatusPill(label: _streamingStatus!, colors: colors),
          ..._streamingBuffers.entries.map((entry) {
            final agentName = _agentNameById(entry.key);
            return StreamingBubble(agentName: agentName, text: entry.value);
          }),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Status pill widget
// ---------------------------------------------------------------------------

/// A small animated pill that shows the current processing status.
class StatusPill extends StatefulWidget {
  final String label;
  final AppThemeColors colors;

  const StatusPill({super.key, required this.label, required this.colors});

  @override
  State<StatusPill> createState() => _StatusPillState();
}

class _StatusPillState extends State<StatusPill>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _fade;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    )..repeat(reverse: true);
    _fade = Tween<double>(begin: 0.5, end: 1.0).animate(_controller);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.xs),
      child: FadeTransition(
        opacity: _fade,
        child: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.sm,
            vertical: AppSpacing.xxs,
          ),
          decoration: BoxDecoration(
            color: widget.colors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(AppSpacing.sm),
            border: Border.all(
              color: widget.colors.primary.withValues(alpha: 0.25),
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
                  color: widget.colors.primary,
                ),
              ),
              const SizedBox(width: AppSpacing.xs),
              Text(
                widget.label,
                style: AppTypography.caption.copyWith(
                  color: widget.colors.primary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
