import 'package:flutter/material.dart';

import 'api_service.dart';
import 'design_system/design_system.dart';
import 'models/agent.dart';
import 'models/chat_message.dart';
import 'models/chat_room.dart';
import 'models/message_status.dart';

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

  @override
  void initState() {
    super.initState();
    _roomName = widget.room.name;
    _loadData();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final agentsData = await ApiService.getRoomAgents(widget.room.id);
      final messagesData = await ApiService.getRoomMessages(widget.room.id);

      if (!mounted) return;
      setState(() {
        _roomAgents = agentsData
            .map((dynamic e) => Agent.fromJson(e as Map<String, dynamic>))
            .toList();
        _messages = messagesData
            .map((dynamic e) => ChatMessage.fromJson(e as Map<String, dynamic>))
            .toList();
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
    });
    _scrollToBottom();

    try {
      final stream = ApiService.streamRoomChat(widget.room.id, text);

      // Current agent being streamed — tracked via [[AGENT:id:name]] markers.
      String? activeAgentId;

      await for (final chunk in stream) {
        if (!mounted) break;

        // Detect agent-switch markers emitted by the backend.
        // Format: [[AGENT:<id>:<name>]]
        final agentMatch = RegExp(
          r'\[\[AGENT:([^:]+):([^\]]+)\]\]',
        ).firstMatch(chunk);

        if (agentMatch != null) {
          activeAgentId = agentMatch.group(1);
          // Ensure a streaming placeholder exists for this agent.
          if (activeAgentId != null &&
              !_streamingBuffers.containsKey(activeAgentId)) {
            _streamingBuffers[activeAgentId] = '';
          }
          setState(() {});
        } else if (activeAgentId != null) {
          setState(() {
            _streamingBuffers[activeAgentId!] =
                (_streamingBuffers[activeAgentId] ?? '') + chunk;
          });
          _scrollToBottom();
        }
      }

      // Reload persisted messages once streaming finishes.
      await _loadData();
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
      final allAgents = allAgentsData
          .map((dynamic e) => Agent.fromJson(e as Map<String, dynamic>))
          .toList();

      if (!mounted) return;

      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (context) => _AddAgentSheet(
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

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Scaffold(
      backgroundColor: colors.background,
      appBar: _buildAppBar(colors),
      body: SafeArea(
        child: Column(
          children: [
            _buildMembersBar(colors),
            Expanded(child: _buildMessageList(colors)),
            if (_isSending && _streamingBuffers.isNotEmpty)
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
        return _MessageItem(message: msg, senderName: _getSenderName(msg));
      },
    );
  }

  Widget _buildStreamingBubbles(AppThemeColors colors) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: _streamingBuffers.entries.map((entry) {
          final agentName = _agentNameById(entry.key);
          return _StreamingBubble(agentName: agentName, text: entry.value);
        }).toList(),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Message item — wraps ChatBubble with a sender label
// ---------------------------------------------------------------------------

class _MessageItem extends StatelessWidget {
  final ChatMessage message;
  final String senderName;

  const _MessageItem({required this.message, required this.senderName});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final isUser = message.isUser;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.xs),
      child: Column(
        crossAxisAlignment:
            isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Padding(
            padding: EdgeInsets.only(
              left: isUser ? 0 : AppSpacing.xs,
              right: isUser ? AppSpacing.xs : 0,
              bottom: AppSpacing.xxs,
            ),
            child: Text(
              senderName,
              style: AppTypography.caption.copyWith(
                color: colors.onSurfaceMuted,
              ),
            ),
          ),
          ChatBubble(
            text: message.text,
            isUser: isUser,
            status: message.status,
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Streaming bubble — shows live agent response while streaming
// ---------------------------------------------------------------------------

class _StreamingBubble extends StatelessWidget {
  final String agentName;
  final String text;

  const _StreamingBubble({required this.agentName, required this.text});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.xs),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(
              left: AppSpacing.xs,
              bottom: AppSpacing.xxs,
            ),
            child: Text(
              agentName,
              style: AppTypography.caption.copyWith(
                color: colors.onSurfaceMuted,
              ),
            ),
          ),
          ChatBubble(
            text: text,
            isUser: false,
            status: MessageStatus.streaming,
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Add agent bottom sheet
// ---------------------------------------------------------------------------

class _AddAgentSheet extends StatefulWidget {
  final List<Agent> allAgents;
  final List<Agent> roomAgents;
  final Future<void> Function(String agentId) onAdd;

  const _AddAgentSheet({
    required this.allAgents,
    required this.roomAgents,
    required this.onAdd,
  });

  @override
  State<_AddAgentSheet> createState() => _AddAgentSheetState();
}

class _AddAgentSheetState extends State<_AddAgentSheet> {
  String? _addingId;

  Future<void> _addAgent(String agentId) async {
    setState(() => _addingId = agentId);
    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);
    try {
      await widget.onAdd(agentId);
      if (mounted) navigator.pop();
    } catch (e) {
      if (!mounted) return;
      messenger.showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
      );
    } finally {
      if (mounted) setState(() => _addingId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final bottomPadding = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.65,
      ),
      padding: EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.xl,
        AppSpacing.lg,
        AppSpacing.xl + bottomPadding,
      ),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(AppSpacing.radiusLg),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Center(
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: colors.border,
                borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Text('Add Persona', style: AppTypography.headingSmall),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'SELECT PERSONAS',
            style: AppTypography.labelSmall.copyWith(
              color: colors.onSurfaceMuted,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Flexible(
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: widget.allAgents.length,
              itemBuilder: (context, index) {
                final agent = widget.allAgents[index];
                final isInRoom = widget.roomAgents.any((a) => a.id == agent.id);
                final isAdding = _addingId == agent.id;

                return ListTile(
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm,
                  ),
                  leading: CircleAvatar(
                    backgroundColor: colors.primary.withValues(alpha: 0.1),
                    child: Text(
                      agent.name[0].toUpperCase(),
                      style: AppTypography.labelMedium.copyWith(
                        color: colors.primary,
                      ),
                    ),
                  ),
                  title: Text(agent.name, style: AppTypography.bodyMedium),
                  subtitle: Text(
                    agent.personality,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.caption.copyWith(
                      color: colors.onSurfaceMuted,
                    ),
                  ),
                  trailing: isInRoom
                      ? Icon(Icons.check_rounded, color: AppColors.success)
                      : isAdding
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Icon(Icons.add_rounded,
                              color: colors.onSurfaceMuted),
                  onTap: isInRoom || isAdding
                      ? null
                      : () {
                          _addAgent(agent.id);
                        },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
