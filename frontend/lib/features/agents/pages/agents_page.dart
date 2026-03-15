import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:miru/core/api/api_service.dart';
import 'package:miru/core/models/agent.dart';
import 'package:miru/core/models/agent_info.dart';

class AgentsPage extends StatefulWidget {
  const AgentsPage({super.key});

  @override
  State<AgentsPage> createState() => _AgentsPageState();
}

class _AgentsPageState extends State<AgentsPage> {
  List<Agent> _agents = [];
  bool _isLoading = true;
  List<Capability> _availableCapabilities = [];
  List<Integration> _availableIntegrations = [];
  Timer? _chatterTimer;
  final Map<String, String> _activeChatter = {};

  @override
  void initState() {
    super.initState();
    _loadAgents();
    _loadAvailableOptions();
    _startIdleChatter();
  }

  @override
  void dispose() {
    _chatterTimer?.cancel();
    super.dispose();
  }

  void _startIdleChatter() {
    _chatterTimer = Timer.periodic(const Duration(seconds: 12), (timer) {
      if (_agents.isEmpty || !mounted) return;

      final random = Random();
      final targetAgent = _agents[random.nextInt(_agents.length)];

      final thoughts = [
        "Hmm...",
        "Interesting...",
        "Hello there!",
        "What's next?",
        "I'm ready",
        "Thinking...",
      ];
      final targetThought = thoughts[random.nextInt(thoughts.length)];

      setState(() {
        _activeChatter.clear();
        _activeChatter[targetAgent.id] = targetThought;
      });

      Future.delayed(const Duration(seconds: 4), () {
        if (mounted) {
          setState(() {
            _activeChatter.remove(targetAgent.id);
          });
        }
      });
    });
  }

  Future<void> _loadAgents() async {
    setState(() => _isLoading = true);
    try {
      final data = await ApiService.getAgents();
      setState(() {
        _agents = data;
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

  Future<void> _loadAvailableOptions() async {
    try {
      final caps = await ApiService.getAgentCapabilities();
      final ints = await ApiService.getAgentIntegrations();
      if (mounted) {
        setState(() {
          _availableCapabilities = caps;
          _availableIntegrations = ints;
        });
      }
    } catch (e) {
      debugPrint('Error loading options: $e');
    }
  }

  void _showCreateAgentDialog() {
    final nameController = TextEditingController();
    final personalityController = TextEditingController();
    final descriptionController = TextEditingController();
    final goalsController = TextEditingController();
    final keywordsController = TextEditingController();
    List<String> selectedCapabilities = [];
    List<String> selectedIntegrations = [];
    bool isGenerating = false;

    showDialog(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Create New Persona'),
              content: SizedBox(
                width: 500,
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: keywordsController,
                              decoration: const InputDecoration(
                                labelText: 'AI Generation Keywords',
                                hintText: 'e.g. pirate, funny, space',
                                prefixIcon: Icon(Icons.psychology),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          isGenerating
                              ? const SizedBox(
                                  width: 110,
                                  height: 24,
                                  child: Row(
                                    children: [
                                      SizedBox(
                                        width: 16,
                                        height: 16,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                        ),
                                      ),
                                      SizedBox(width: 8),
                                      Text('Decoding...'),
                                    ],
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
                                        nameController.text = result.name;
                                        personalityController.text =
                                            result.personality;
                                        descriptionController.text =
                                            result.description;
                                        goalsController.text = result.goals
                                            .join('\n');

                                        selectedCapabilities =
                                            result.capabilities;

                                        selectedIntegrations =
                                            result.suggestedIntegrations;

                                        isGenerating = false;
                                      });
                                    } catch (e) {
                                      setDialogState(
                                        () => isGenerating = false,
                                      );
                                      if (!context.mounted) return;
                                      ScaffoldMessenger.of(
                                        context,
                                      ).showSnackBar(
                                        SnackBar(
                                          content: Text(
                                            'Generation failed: $e',
                                          ),
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
                          hintText: 'e.g. Captain Bluebeard',
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: descriptionController,
                        decoration: const InputDecoration(
                          labelText: 'Short Description',
                          hintText: 'A seafaring AI who loves pirate jokes',
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: personalityController,
                        decoration: const InputDecoration(
                          labelText: 'Personality & Behavior',
                          hintText: 'You speak with a pirate accent...',
                        ),
                        maxLines: 4,
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: goalsController,
                        decoration: const InputDecoration(
                          labelText: 'Goals (one per line)',
                          hintText:
                              'Tell pirate jokes\nHelp user find treasure',
                        ),
                        maxLines: 3,
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        'Capabilities',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        children: _availableCapabilities.map((cap) {
                          final id = cap.id;
                          final name = cap.name;
                          final isSelected = selectedCapabilities.contains(id);
                          return FilterChip(
                            label: Text(name),
                            selected: isSelected,
                            onSelected: (selected) {
                              setDialogState(() {
                                if (selected) {
                                  selectedCapabilities.add(id);
                                } else {
                                  selectedCapabilities.remove(id);
                                }
                              });
                            },
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        'Integrations',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        children: _availableIntegrations.map((integration) {
                          final type = integration.type;
                          final name = integration.displayName;
                          final isSelected = selectedIntegrations.contains(
                            type,
                          );
                          final isComingSoon =
                              integration.status == 'coming_soon';

                          return FilterChip(
                            label: Text(name),
                            selected: isSelected,
                            onSelected: isComingSoon
                                ? null
                                : (selected) {
                                    setDialogState(() {
                                      if (selected) {
                                        selectedIntegrations.add(type);
                                      } else {
                                        selectedIntegrations.remove(type);
                                      }
                                    });
                                  },
                            avatar: isComingSoon
                                ? const Icon(Icons.lock_clock, size: 16)
                                : null,
                          );
                        }).toList(),
                      ),
                    ],
                  ),
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
                      final goals = goalsController.text
                          .split('\n')
                          .where((s) => s.trim().isNotEmpty)
                          .toList();

                      await ApiService.createAgent(
                        nameController.text,
                        personalityController.text,
                        description: descriptionController.text.isEmpty
                            ? null
                            : descriptionController.text,
                        goals: goals,
                        capabilities: selectedCapabilities,
                        integrations: selectedIntegrations,
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
                final String? chatter = _activeChatter[agent.id];

                final isDark = Theme.of(context).brightness == Brightness.dark;
                final baseColors = [
                  Colors.blue,
                  Colors.teal,
                  Colors.red,
                  Colors.indigo,
                  Colors.deepPurple,
                  Colors.orange,
                ];
                final themeColor =
                    baseColors[agent.name.hashCode.abs() % baseColors.length];
                final bgColors = isDark
                    ? [
                        themeColor.withValues(alpha: 0.2),
                        themeColor.withValues(alpha: 0.05),
                      ]
                    : [
                        themeColor.withValues(alpha: 0.15),
                        themeColor.withValues(alpha: 0.05),
                      ];

                return Card(
                  margin: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  clipBehavior: Clip.antiAlias,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: BorderSide(
                      color: themeColor.withValues(alpha: 0.3),
                      width: 1,
                    ),
                  ),
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: bgColors,
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                backgroundImage: agent.avatarImage,
                                radius: 28,
                                child: agent.avatarUrl == null
                                    ? null
                                    : Text(agent.name[0].toUpperCase()),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            agent.name,
                                            style: const TextStyle(
                                              fontSize: 18,
                                              fontWeight: FontWeight.bold,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                        if (chatter != null)
                                          Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 8,
                                              vertical: 4,
                                            ),
                                            decoration: BoxDecoration(
                                              color: Theme.of(
                                                context,
                                              ).colorScheme.surface,
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                              border: Border.all(
                                                color: themeColor.withValues(
                                                  alpha: 0.5,
                                                ),
                                              ),
                                            ),
                                            child: Text(
                                              chatter,
                                              style: TextStyle(
                                                fontSize: 12,
                                                color: themeColor,
                                              ),
                                            ),
                                          ),
                                      ],
                                    ),
                                    if (agent.description != null) ...[
                                      const SizedBox(height: 2),
                                      Text(
                                        agent.description!,
                                        style: TextStyle(
                                          color: isDark
                                              ? Colors.grey[400]
                                              : Colors.grey[700],
                                        ),
                                      ),
                                    ],
                                    const SizedBox(height: 6),
                                    Row(
                                      children: [
                                        Icon(
                                          Icons.military_tech,
                                          size: 16,
                                          color: themeColor,
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          'Lvl ${agent.connectionLevel}',
                                          style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            color: themeColor,
                                            fontSize: 13,
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Icon(
                                          Icons.mood,
                                          size: 16,
                                          color: isDark
                                              ? Colors.grey[400]
                                              : Colors.grey[700],
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          agent.mood,
                                          style: TextStyle(
                                            color: isDark
                                                ? Colors.grey[400]
                                                : Colors.grey[700],
                                            fontSize: 13,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            agent.personality,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 14),
                          ),
                          if (agent.capabilities.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 8,
                              runSpacing: 4,
                              children: agent.capabilities.map((cap) {
                                return Chip(
                                  label: Text(
                                    cap,
                                    style: const TextStyle(fontSize: 12),
                                  ),
                                  materialTapTargetSize:
                                      MaterialTapTargetSize.shrinkWrap,
                                  padding: EdgeInsets.zero,
                                );
                              }).toList(),
                            ),
                          ],
                        ],
                      ),
                    ),
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
