import 'package:flutter/material.dart';
import 'api_service.dart';
import 'models/agent.dart';

class AgentsPage extends StatefulWidget {
  const AgentsPage({super.key});

  @override
  State<AgentsPage> createState() => _AgentsPageState();
}

class _AgentsPageState extends State<AgentsPage> {
  final ApiService _apiService = ApiService();
  List<Agent> _agents = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadAgents();
  }

  Future<void> _loadAgents() async {
    setState(() => _isLoading = true);
    try {
      final data = await _apiService.getAgents();
      setState(() {
        _agents = data.map((e) => Agent.fromJson(e)).toList();
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading agents: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showCreateAgentDialog() {
    final nameController = TextEditingController();
    final personalityController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Create New Persona'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: const InputDecoration(labelText: 'Agent Name'),
              ),
              TextField(
                controller: personalityController,
                decoration: const InputDecoration(labelText: 'Personality (System Prompt)'),
                maxLines: 3,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (nameController.text.isEmpty || personalityController.text.isEmpty) return;
                Navigator.pop(context);
                try {
                  await _apiService.createAgent(nameController.text, personalityController.text);
                  _loadAgents();
                } catch (e) {
                  if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                }
              },
              child: const Text('Create'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Agents')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _agents.isEmpty
              ? const Center(child: Text('No agents created yet.'))
              : ListView.builder(
                  itemCount: _agents.length,
                  itemBuilder: (context, index) {
                    final agent = _agents[index];
                    return ListTile(
                      title: Text(agent.name),
                      subtitle: Text(agent.personality, maxLines: 1, overflow: TextOverflow.ellipsis),
                    );
                  },
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateAgentDialog,
        child: const Icon(Icons.add),
      ),
    );
  }
}
