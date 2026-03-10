import 'package:flutter/material.dart';
import 'api_service.dart';
import 'models/chat_room.dart';
import 'models/agent.dart';
import 'models/chat_message.dart';

class GroupChatPage extends StatefulWidget {
  final ChatRoom room;
  const GroupChatPage({super.key, required this.room});

  @override
  State<GroupChatPage> createState() => _GroupChatPageState();
}

class _GroupChatPageState extends State<GroupChatPage> {

  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  List<ChatMessage> _messages = [];
  List<Agent> _roomAgents = [];
  bool _isLoading = true;
  bool _isSending = false;
  String _streamingMessage = '';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final agentsData = await ApiService.getRoomAgents(widget.room.id);
      final messagesData = await ApiService.getRoomMessages(widget.room.id);

      setState(() {
        _roomAgents = agentsData.map((dynamic e) => Agent.fromJson(e as Map<String, dynamic>)).toList();
        _messages = messagesData.map((dynamic e) => ChatMessage.fromJson(e as Map<String, dynamic>)).toList();
      });
      _scrollToBottom();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage() async {
    if (_messageController.text.trim().isEmpty || _isSending) {
      return;
    }

    final userMessageText = _messageController.text.trim();
    _messageController.clear();

    // Optimistically add user message
    final fakeId = DateTime.now().millisecondsSinceEpoch.toString();
    setState(() {
      _messages.add(
        ChatMessage(
          id: fakeId,
          roomId: widget.room.id,
          userId: 'temp', // This indicates it's from the user
          text: userMessageText,
          createdAt: DateTime.now().toIso8601String(),
        ),
      );
      _isSending = true;
      _streamingMessage = '';
    });
    _scrollToBottom();

    try {
      final stream = ApiService.streamRoomChat(
        widget.room.id,
        userMessageText,
      );
      await for (final chunk in stream) {
        if (!mounted) {
          break;
        }
        setState(() {
          _streamingMessage += chunk;
        });
        _scrollToBottom();
      }

      // Reload to get real saved messages instead of trying to parse the text stream
      await _loadData();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to send: $e')));
    } finally {
      if (mounted) {
        setState(() {
          _isSending = false;
          _streamingMessage = '';
        });
      }
    }
  }

  void _showAddAgentDialog() async {
    try {
      final allAgentsData = await ApiService.getAgents();
      final allAgents = allAgentsData.map((dynamic e) => Agent.fromJson(e as Map<String, dynamic>)).toList();

      if (!mounted) {
        return;
      }

      showDialog(
        context: context,
        builder: (dialogContext) {
          return AlertDialog(
            title: const Text('Add Agent to Room'),
            content: SizedBox(
              width: double.maxFinite,
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: allAgents.length,
                itemBuilder: (context, index) {
                  final agent = allAgents[index];
                  final isAlreadyInRoom = _roomAgents.any(
                    (a) => a.id == agent.id,
                  );
                  return ListTile(
                    title: Text(agent.name),
                    trailing: isAlreadyInRoom
                        ? const Icon(Icons.check, color: Colors.green)
                        : const Icon(Icons.add),
                    onTap: isAlreadyInRoom
                        ? null
                        : () async {
                            Navigator.pop(dialogContext);
                            try {
                              await ApiService.addAgentToRoom(
                                widget.room.id,
                                agent.id,
                              );
                              _loadData();
                            } catch (e) {
                              if (!dialogContext.mounted) return;
                              ScaffoldMessenger.of(dialogContext).showSnackBar(
                                SnackBar(content: Text('Error adding: $e')),
                              );
                            }
                          },
                  );
                },
              ),
            ),
          );
        },
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading agents: $e')));
    }
  }

  String _getSenderName(ChatMessage msg) {
    if (msg.isUser) {
      return 'Me';
    }
    if (msg.isAgent) {
      final agent = _roomAgents.where((a) => a.id == msg.agentId).firstOrNull;
      return agent?.name ?? 'Agent';
    }
    return 'Unknown';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.room.name),
        actions: [
          IconButton(
            icon: const Icon(Icons.group_add),
            onPressed: _showAddAgentDialog,
            tooltip: 'Add Agent',
          ),
        ],
      ),
      body: Column(
        children: [
          // Agents in room indicator
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
            color: Theme.of(context).colorScheme.surfaceContainerHighest,
            width: double.infinity,
            child: Text(
              'Members: You, ${_roomAgents.map((a) => a.name).join(', ')}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),

          Expanded(
            child: _isLoading && _messages.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final msg = _messages[index];
                      final isMe = msg.isUser;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        alignment: isMe
                            ? Alignment.centerRight
                            : Alignment.centerLeft,
                        child: Column(
                          crossAxisAlignment: isMe
                              ? CrossAxisAlignment.end
                              : CrossAxisAlignment.start,
                          children: [
                            Text(
                              _getSenderName(msg),
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(
                                    color: Theme.of(
                                      context,
                                    ).colorScheme.onSurfaceVariant,
                                  ),
                            ),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 10,
                              ),
                              decoration: BoxDecoration(
                                color: isMe
                                    ? Theme.of(
                                        context,
                                      ).colorScheme.primaryContainer
                                    : Theme.of(
                                        context,
                                      ).colorScheme.secondaryContainer,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Text(msg.text),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),

          if (_isSending && _streamingMessage.isNotEmpty)
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Agents typing... \n$_streamingMessage',
                  style: const TextStyle(color: Colors.grey),
                ),
              ),
            ),

          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: const InputDecoration(
                      hintText: 'Type a message...',
                      border: OutlineInputBorder(),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                    enabled: !_isSending,
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.send),
                  onPressed: _isSending ? null : _sendMessage,
                  color: Theme.of(context).colorScheme.primary,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
