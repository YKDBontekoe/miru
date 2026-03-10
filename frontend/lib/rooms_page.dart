import 'package:flutter/material.dart';
import 'api_service.dart';
import 'models/chat_room.dart';

import 'group_chat_page.dart';

class RoomsPage extends StatefulWidget {
  const RoomsPage({super.key});

  @override
  State<RoomsPage> createState() => _RoomsPageState();
}

class _RoomsPageState extends State<RoomsPage> {

  List<ChatRoom> _rooms = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadRooms();
  }

  Future<void> _loadRooms() async {
    setState(() => _isLoading = true);
    try {
      final data = await ApiService.getRooms();
      setState(() {
        _rooms = data.map((dynamic e) => ChatRoom.fromJson(e as Map<String, dynamic>)).toList();
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _showCreateRoomDialog() {
    final nameController = TextEditingController();
    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Create Group Chat'),
          content: TextField(
            controller: nameController,
            decoration: const InputDecoration(labelText: 'Room Name'),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (nameController.text.isEmpty) {
                  return;
                }
                Navigator.pop(dialogContext);
                try {
                  await ApiService.createRoom(nameController.text);
                  _loadRooms();
                } catch (e) {
                  if (!dialogContext.mounted) return;
                  ScaffoldMessenger.of(dialogContext).showSnackBar(SnackBar(content: Text('Error: $e')));
                }
              },
              child: const Text('Create'),
            ),
          ],
        );
      },
    );
  }

  void _openRoom(ChatRoom room) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => GroupChatPage(room: room)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Group Chats')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _rooms.isEmpty
          ? const Center(child: Text('No group chats yet.'))
          : ListView.builder(
              itemCount: _rooms.length,
              itemBuilder: (context, index) {
                final room = _rooms[index];
                return ListTile(
                  title: Text(room.name),
                  trailing: const Icon(Icons.arrow_forward_ios),
                  onTap: () => _openRoom(room),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateRoomDialog,
        tooltip: 'New Group Chat',
        child: const Icon(Icons.add),
      ),
    );
  }
}
