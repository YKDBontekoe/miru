import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:miru/core/api/api_service.dart';
import 'package:miru/core/models/agent.dart';
import 'package:miru/core/models/agent_info.dart';
import 'package:miru/core/design_system/design_system.dart';

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
      final data = await ApiService.instance.getAgents();
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
      final caps = await ApiService.instance.getAgentCapabilities();
      final ints = await ApiService.instance.getAgentIntegrations();
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
              content: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 500),
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
                          const SizedBox(width: AppSpacing.sm),
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
                                      final result = await ApiService.instance
                                          .generateAgent(
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
                      const SizedBox(height: AppSpacing.lg),
                      TextField(
                        controller: descriptionController,
                        decoration: const InputDecoration(
                          labelText: 'Short Description',
                          hintText: 'A seafaring AI who loves pirate jokes',
                        ),
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      TextField(
                        controller: personalityController,
                        decoration: const InputDecoration(
                          labelText: 'Personality & Behavior',
                          hintText: 'You speak with a pirate accent...',
                        ),
                        maxLines: 4,
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      TextField(
                        controller: goalsController,
                        decoration: const InputDecoration(
                          labelText: 'Goals (one per line)',
                          hintText:
                              'Tell pirate jokes\nHelp user find treasure',
                        ),
                        maxLines: 3,
                      ),
                      const SizedBox(height: AppSpacing.xxl),
                      Text(
                        'Capabilities',
                        style: AppTypography.labelLarge.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Wrap(
                        spacing: AppSpacing.sm,
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
                      const SizedBox(height: AppSpacing.xxl),
                      Text(
                        'Integrations',
                        style: AppTypography.labelLarge.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Wrap(
                        spacing: AppSpacing.sm,
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

                      await ApiService.instance.createAgent(
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
    final colors = context.colors;
    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        title: Text(
          'Personas',
          style: AppTypography.headingMedium.copyWith(color: colors.onSurface),
        ),
        backgroundColor: colors.surfaceHigh,
      ),
      body: AnimatedSwitcher(
        duration: AppDurations.medium,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _agents.isEmpty
            ? const AppEmptyState(
                title: 'No personas yet',
                subtitle:
                    'Create your first AI persona\nto start collaborating.',
              )
            : ListView.builder(
                itemCount: _agents.length,
                itemBuilder: (context, index) {
                  final agent = _agents[index];
                  final String? chatter = _activeChatter[agent.id];

                  final isDark = context.isDark;
                  final baseColors = [
                    colors.primary,
                    colors.info,
                    colors.error,
                    colors.success,
                    colors.primaryLight,
                    colors.warning,
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

                  return Container(
                    margin: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.lg,
                      vertical: AppSpacing.sm,
                    ),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                      boxShadow: AppShadows.sm,
                    ),
                    child: Card(
                      margin: AppSpacing.paddingNone,
                      clipBehavior: Clip.antiAlias,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(
                          AppSpacing.radiusLg,
                        ),
                        side: BorderSide(
                          color: themeColor.withValues(alpha: 0.3),
                          width: 1,
                        ),
                      ),
                      child: InkWell(
                        onTap: () {
                          // Tap target for persona card future hooks
                        },
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: bgColors,
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(AppSpacing.lg),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    CircleAvatar(
                                      backgroundImage: agent.avatarImage,
                                      radius: AppSpacing.avatarLg / 2,
                                      child: agent.avatarUrl == null
                                          ? Text(agent.name[0].toUpperCase())
                                          : null,
                                    ),
                                    const SizedBox(width: AppSpacing.lg),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Expanded(
                                                child: Text(
                                                  agent.name,
                                                  style: AppTypography
                                                      .headingSmall
                                                      .copyWith(
                                                        fontWeight:
                                                            FontWeight.w700,
                                                        color: context
                                                            .colors
                                                            .onSurface,
                                                      ),
                                                  maxLines: 1,
                                                  overflow:
                                                      TextOverflow.ellipsis,
                                                ),
                                              ),
                                              AnimatedSwitcher(
                                                duration: const Duration(
                                                  milliseconds: 250,
                                                ),
                                                transitionBuilder:
                                                    (
                                                      child,
                                                      animation,
                                                    ) => FadeTransition(
                                                      opacity: animation,
                                                      child: ScaleTransition(
                                                        scale: Tween<double>(
                                                          begin: 0.85,
                                                          end: 1.0,
                                                        ).animate(animation),
                                                        child: child,
                                                      ),
                                                    ),
                                                child: chatter != null
                                                    ? Container(
                                                        key: ValueKey(chatter),
                                                        padding:
                                                            const EdgeInsets.symmetric(
                                                              horizontal:
                                                                  AppSpacing.sm,
                                                              vertical:
                                                                  AppSpacing.xs,
                                                            ),
                                                        decoration: BoxDecoration(
                                                          color: context
                                                              .colors
                                                              .surface,
                                                          borderRadius:
                                                              BorderRadius.circular(
                                                                AppSpacing
                                                                    .radiusMd,
                                                              ),
                                                          border: Border.all(
                                                            color: themeColor
                                                                .withValues(
                                                                  alpha: 0.5,
                                                                ),
                                                          ),
                                                        ),
                                                        child: Text(
                                                          chatter,
                                                          style: AppTypography
                                                              .bodySmall
                                                              .copyWith(
                                                                color:
                                                                    themeColor,
                                                              ),
                                                        ),
                                                      )
                                                    : const SizedBox.shrink(
                                                        key: ValueKey('empty'),
                                                      ),
                                              ),
                                            ],
                                          ),
                                          if (agent.description != null) ...[
                                            const SizedBox(
                                              height: AppSpacing.xxs,
                                            ),
                                            Text(
                                              agent.description!,
                                              style: AppTypography.bodyMedium
                                                  .copyWith(
                                                    color:
                                                        colors.onSurfaceMuted,
                                                  ),
                                            ),
                                          ],
                                          const SizedBox(height: AppSpacing.sm),
                                          Row(
                                            children: [
                                              Icon(
                                                Icons.military_tech,
                                                size: AppSpacing.iconSm,
                                                color: themeColor,
                                              ),
                                              const SizedBox(
                                                width: AppSpacing.xs,
                                              ),
                                              Text(
                                                'Lvl ${agent.connectionLevel}',
                                                style: AppTypography.bodySmall
                                                    .copyWith(
                                                      fontWeight:
                                                          FontWeight.bold,
                                                      color: themeColor,
                                                    ),
                                              ),
                                              const SizedBox(
                                                width: AppSpacing.md,
                                              ),
                                              Icon(
                                                Icons.mood,
                                                size: AppSpacing.iconSm,
                                                color: colors.onSurfaceMuted,
                                              ),
                                              const SizedBox(
                                                width: AppSpacing.xs,
                                              ),
                                              Text(
                                                agent.mood,
                                                style: AppTypography.bodySmall
                                                    .copyWith(
                                                      color:
                                                          colors.onSurfaceMuted,
                                                    ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: AppSpacing.md),
                                Text(
                                  agent.personality,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: AppTypography.bodyMedium,
                                ),
                                if (agent.capabilities.isNotEmpty) ...[
                                  const SizedBox(height: AppSpacing.md),
                                  Wrap(
                                    spacing: AppSpacing.sm,
                                    runSpacing: AppSpacing.xs,
                                    children: agent.capabilities.map((cap) {
                                      return Chip(
                                        label: Text(
                                          cap,
                                          style: AppTypography.bodySmall,
                                        ),
                                        materialTapTargetSize:
                                            MaterialTapTargetSize.shrinkWrap,
                                        padding: AppSpacing.paddingNone,
                                      );
                                    }).toList(),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
      ),
      floatingActionButton: Container(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          boxShadow: AppShadows.primaryGlow,
        ),
        child: FloatingActionButton(
          elevation: 0,
          onPressed: _showCreateAgentDialog,
          child: const Icon(Icons.add),
        ),
      ),
    );
  }
}
