import 'package:flutter/material.dart';
import 'api_service.dart';
import 'models/agent.dart';

class AgentsPage extends StatefulWidget {
  const AgentsPage({super.key});

  @override
  State<AgentsPage> createState() => _AgentsPageState();
}

class _AgentsPageState extends State<AgentsPage> {
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
      final data = await ApiService.getAgents();
      setState(() {
        _agents = data
            .map((dynamic e) => Agent.fromJson(e as Map<String, dynamic>))
            .toList();
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error loading agents: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showCreateAgentDialog() {
    final nameController = TextEditingController();
    final personalityController = TextEditingController();
    final keywordsController = TextEditingController();
    bool isGenerating = false;

    showDialog(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Create New Persona'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: keywordsController,
                            decoration: const InputDecoration(
                              labelText: 'AI Generation Keywords',
                              hintText: 'e.g. pirate, funny, space',
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        isGenerating
                            ? const SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : IconButton(
                                icon: const Icon(Icons.auto_awesome),
                                tooltip: 'Generate with AI',
                                onPressed: () async {
                                  if (keywordsController.text.isEmpty) return;
                                  setDialogState(() => isGenerating = true);
                                  try {
                                    final result =
                                        await ApiService.generateAgent(
                                      keywordsController.text,
                                    );
                                    setDialogState(() {
                                      nameController.text =
                                          result['name'] as String? ?? '';
                                      personalityController.text =
                                          result['personality'] as String? ??
                                              '';
                                      isGenerating = false;
                                    });
                                  } catch (e) {
                                    setDialogState(() => isGenerating = false);
                                    if (!context.mounted) return;
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('Generation failed: $e'),
                                      ),
                                    );
                                  }
                                },
                              ),
                      ],
                    ),
                    const Divider(height: 32),
                    TextField(
                      controller: nameController,
                      decoration: const InputDecoration(
                        labelText: 'Agent Name',
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: personalityController,
                      decoration: const InputDecoration(
                        labelText: 'Personality (System Prompt)',
                      ),
                      maxLines: 3,
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () async {
                    if (nameController.text.isEmpty ||
                        personalityController.text.isEmpty) {
                      return;
                    }
                    final messenger = ScaffoldMessenger.of(context);
                    Navigator.pop(dialogContext);
                    try {
                      await ApiService.createAgent(
                        nameController.text,
                        personalityController.text,
                      );
                      _loadAgents();
                    } catch (e) {
                      messenger.showSnackBar(
                        SnackBar(content: Text('Error: $e')),
                      );
                    }
                  },
                  child: const Text('Create'),
                ),
              ],
            );
          },
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
                      subtitle: Text(
                        agent.personality,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
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
