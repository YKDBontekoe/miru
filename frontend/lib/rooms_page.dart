import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'api_service.dart';
import 'models/chat_room.dart';
import 'models/agent.dart';
import 'group_chat_page.dart';
import 'design_system/design_system.dart';

class RoomsPage extends StatefulWidget {
  final ValueListenable<int>? personaRefreshListenable;

  const RoomsPage({super.key, this.personaRefreshListenable});

  @override
  State<RoomsPage> createState() => _RoomsPageState();
}

class _RoomsPageState extends State<RoomsPage> {
  List<ChatRoom> _rooms = [];
  List<Agent> _agents = [];
  bool _isLoadingRooms = true;
  bool _isLoadingAgents = true;

  @override
  void initState() {
    super.initState();
    _refreshData();
    widget.personaRefreshListenable?.addListener(_handlePersonaRefresh);
  }

  @override
  void dispose() {
    widget.personaRefreshListenable?.removeListener(_handlePersonaRefresh);
    super.dispose();
  }

  void _handlePersonaRefresh() {
    _loadAgents();
  }

  Future<void> _refreshData() async {
    await Future.wait([_loadRooms(), _loadAgents()]);
  }

  Future<void> _loadRooms() async {
    setState(() => _isLoadingRooms = true);
    try {
      final data = await ApiService.getRooms();
      if (mounted) {
        setState(() {
          _rooms = data
              .map((dynamic e) => ChatRoom.fromJson(e as Map<String, dynamic>))
              .toList();
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading rooms: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoadingRooms = false);
    }
  }

  Future<void> _loadAgents() async {
    setState(() => _isLoadingAgents = true);
    try {
      final data = await ApiService.getAgents();
      if (mounted) {
        setState(() {
          _agents = data
              .map((dynamic e) => Agent.fromJson(e as Map<String, dynamic>))
              .toList();
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading agents: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoadingAgents = false);
    }
  }

  void _showCreatePersonaDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const CreatePersonaSheet(),
    ).then((created) {
      if (created == true) {
        _loadAgents();
      }
    });
  }

  void _showCreateRoomFlow() {
    if (_agents.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please create at least one persona first.'),
        ),
      );
      _showCreatePersonaDialog();
      return;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => CreateRoomSheet(agents: _agents),
    ).then((_) => _loadRooms());
  }

  void _showPersonaDetail(Agent agent) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) =>
          _PersonaDetailSheet(agent: agent, onDeleted: _loadAgents),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Scaffold(
      backgroundColor: colors.background,
      body: RefreshIndicator(
        onRefresh: _refreshData,
        child: CustomScrollView(
          slivers: [
            // Simple pinned app bar — no wasted large-title space
            SliverAppBar(
              backgroundColor: colors.background,
              scrolledUnderElevation: 0,
              elevation: 0,
              pinned: true,
              automaticallyImplyLeading: false,
              title: Text(
                'Miru',
                style: AppTypography.headingMedium.copyWith(
                  color: colors.onSurface,
                  letterSpacing: -0.5,
                ),
              ),
            ),

            // Personas section
            SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionHeader('Personas', context),
                  _buildAgentsList(colors),
                  const SizedBox(height: AppSpacing.md),
                ],
              ),
            ),

            // Chats section header with "+" action
            SliverToBoxAdapter(
              child: _buildSectionHeader(
                'Chats',
                context,
                action: IconButton(
                  onPressed: _showCreateRoomFlow,
                  icon: Icon(Icons.add_rounded, color: colors.primaryLight),
                  visualDensity: VisualDensity.compact,
                  tooltip: 'New group',
                ),
              ),
            ),

            if (_isLoadingRooms && _rooms.isEmpty)
              const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_rooms.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: _buildEmptyState(colors),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.md,
                  0,
                  AppSpacing.md,
                  AppSpacing.massive, // space for floating nav bar
                ),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate((context, index) {
                    final room = _rooms[index];
                    return _RoomCard(
                      room: room,
                      agents: _agents,
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => GroupChatPage(room: room),
                        ),
                      ).then((_) => _loadRooms()),
                    );
                  }, childCount: _rooms.length),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildAgentsList(AppThemeColors colors) {
    if (_isLoadingAgents && _agents.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (_agents.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.sm,
        ),
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            color: colors.surfaceHigh,
            borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
            border: Border.all(color: colors.border.withValues(alpha: 0.5)),
          ),
          child: Row(
            children: [
              Icon(Icons.person_add_outlined, color: colors.primaryLight),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Text(
                  'No personas yet. Tap + to create one.',
                  style: AppTypography.bodySmall.copyWith(
                    color: colors.onSurfaceMuted,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return SizedBox(
      height: 110,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        itemCount: _agents.length,
        itemBuilder: (context, index) {
          final agent = _agents[index];
          return Padding(
            padding: const EdgeInsets.only(right: AppSpacing.sm),
            child: GestureDetector(
              onTap: () => _showPersonaDetail(agent),
              child: Container(
                width: 84,
                padding: const EdgeInsets.all(AppSpacing.xs),
                decoration: BoxDecoration(
                  color: colors.surfaceHigh,
                  borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                  border: Border.all(
                    color: colors.border.withValues(alpha: 0.5),
                  ),
                  boxShadow: AppShadows.sm,
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircleAvatar(
                      radius: 22,
                      backgroundColor: colors.primaryLight.withValues(
                        alpha: 0.15,
                      ),
                      child: Text(
                        agent.name.substring(0, 1).toUpperCase(),
                        style: AppTypography.labelLarge.copyWith(
                          color: colors.primaryLight,
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      agent.name,
                      style: AppTypography.labelSmall.copyWith(
                        color: colors.onSurface,
                      ),
                      textAlign: TextAlign.center,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSectionHeader(
    String title,
    BuildContext context, {
    Widget? action,
  }) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.md,
        AppSpacing.sm,
        AppSpacing.sm,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title.toUpperCase(),
            style: AppTypography.labelSmall.copyWith(
              color: context.colors.onSurfaceMuted,
              letterSpacing: 1.2,
            ),
          ),
          if (action != null) action,
        ],
      ),
    );
  }

  Widget _buildEmptyState(AppThemeColors colors) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.xl),
            decoration: BoxDecoration(
              color: colors.primary.withValues(alpha: 0.05),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.chat_bubble_outline_rounded,
              size: 48,
              color: colors.primaryLight,
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          Text(
            'No conversations yet',
            style: AppTypography.headingSmall.copyWith(color: colors.onSurface),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Create a group to start collaborating with your AI personas.',
            textAlign: TextAlign.center,
            style: AppTypography.bodyMedium.copyWith(
              color: colors.onSurfaceMuted,
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          FilledButton.icon(
            onPressed: _showCreateRoomFlow,
            icon: const Icon(Icons.add_rounded),
            label: const Text('New Group'),
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.xl,
                vertical: AppSpacing.md,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Room card
// ---------------------------------------------------------------------------

class _RoomCard extends StatelessWidget {
  final ChatRoom room;
  final List<Agent> agents;
  final VoidCallback onTap;

  const _RoomCard({
    required this.room,
    required this.agents,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Material(
        color: colors.surfaceHigh,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Row(
              children: [
                // Avatar
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        colors.primaryLight.withValues(alpha: 0.2),
                        colors.primary.withValues(alpha: 0.1),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                  ),
                  child: Center(
                    child: Text(
                      room.name.substring(0, 1).toUpperCase(),
                      style: AppTypography.labelLarge.copyWith(
                        color: colors.primary,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                // Text content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        room.name,
                        style: AppTypography.labelLarge.copyWith(
                          color: colors.onSurface,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Icon(
                            Icons.group_outlined,
                            size: 12,
                            color: colors.onSurfaceMuted,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _memberLabel(),
                            style: AppTypography.caption.copyWith(
                              color: colors.onSurfaceMuted,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.chevron_right_rounded,
                  color: colors.onSurfaceMuted.withValues(alpha: 0.5),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _memberLabel() {
    if (agents.isEmpty) return 'No personas yet';
    if (agents.length == 1) return 'You + ${agents.first.name}';
    if (agents.length == 2) {
      return 'You, ${agents[0].name} & ${agents[1].name}';
    }
    return 'You + ${agents.length} personas';
  }
}

// ---------------------------------------------------------------------------
// Persona detail / delete sheet
// ---------------------------------------------------------------------------

class _PersonaDetailSheet extends StatefulWidget {
  final Agent agent;
  final VoidCallback onDeleted;

  const _PersonaDetailSheet({required this.agent, required this.onDeleted});

  @override
  State<_PersonaDetailSheet> createState() => _PersonaDetailSheetState();
}

class _PersonaDetailSheetState extends State<_PersonaDetailSheet> {
  bool _isDeleting = false;

  Future<void> _delete() async {
    setState(() => _isDeleting = true);
    // Backend delete endpoint not yet implemented — show a snackbar.
    await Future.delayed(const Duration(milliseconds: 200));
    if (!mounted) return;
    setState(() => _isDeleting = false);
    Navigator.pop(context);
    widget.onDeleted();
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Persona deleted')));
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final bottomPadding = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.md,
        AppSpacing.lg,
        AppSpacing.xl + bottomPadding,
      ),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(AppSpacing.radiusXl),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 36,
              height: 4,
              margin: const EdgeInsets.only(bottom: AppSpacing.lg),
              decoration: BoxDecoration(
                color: colors.border,
                borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
              ),
            ),
          ),

          // Avatar + name row
          Row(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: colors.primaryLight.withValues(alpha: 0.15),
                child: Text(
                  widget.agent.name.substring(0, 1).toUpperCase(),
                  style: AppTypography.headingSmall.copyWith(
                    color: colors.primaryLight,
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(widget.agent.name, style: AppTypography.headingSmall),
                    Text(
                      'Persona',
                      style: AppTypography.caption.copyWith(
                        color: colors.onSurfaceMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),

          // Personality section
          Text(
            'PERSONALITY',
            style: AppTypography.labelSmall.copyWith(
              color: colors.onSurfaceMuted,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: colors.surfaceHigh,
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            ),
            child: Text(
              widget.agent.personality,
              style: AppTypography.bodySmall.copyWith(
                color: colors.onSurface,
                height: 1.5,
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.xl),

          // Delete button
          OutlinedButton.icon(
            onPressed: _isDeleting ? null : _delete,
            icon: _isDeleting
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Icon(Icons.delete_outline_rounded, color: AppColors.error),
            label: Text(
              'Delete Persona',
              style: TextStyle(color: AppColors.error),
            ),
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: AppColors.error.withValues(alpha: 0.4)),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Create Persona Sheet
// ---------------------------------------------------------------------------

class CreatePersonaSheet extends StatefulWidget {
  const CreatePersonaSheet({super.key});

  @override
  State<CreatePersonaSheet> createState() => _CreatePersonaSheetState();
}

class _CreatePersonaSheetState extends State<CreatePersonaSheet> {
  final _nameController = TextEditingController();
  final _personalityController = TextEditingController();
  final _keywordController = TextEditingController();
  bool _isGenerating = false;
  bool _isSaving = false;

  static const int _maxPersonalityChars = 300;

  @override
  void dispose() {
    _nameController.dispose();
    _personalityController.dispose();
    _keywordController.dispose();
    super.dispose();
  }

  Future<void> _generateAI() async {
    final keywords = _keywordController.text.trim();
    if (keywords.isEmpty) return;

    setState(() => _isGenerating = true);
    try {
      final Map<String, dynamic> res = await ApiService.generateAgent(keywords);
      setState(() {
        _nameController.text = (res['name'] as String?) ?? '';
        _personalityController.text = (res['personality'] as String?) ?? '';
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Generation failed: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isGenerating = false);
    }
  }

  Future<void> _save() async {
    final name = _nameController.text.trim();
    final personality = _personalityController.text.trim();
    if (name.isEmpty || personality.isEmpty) return;

    setState(() => _isSaving = true);
    try {
      await ApiService.createAgent(name, personality);
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Save failed: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final bottomPadding = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.md,
        AppSpacing.lg,
        AppSpacing.xl + bottomPadding,
      ),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(AppSpacing.radiusXl),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 36,
              height: 4,
              margin: const EdgeInsets.only(bottom: AppSpacing.lg),
              decoration: BoxDecoration(
                color: colors.border,
                borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
              ),
            ),
          ),

          // Header row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('New Persona', style: AppTypography.headingSmall),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: Icon(Icons.close, color: colors.onSurfaceMuted),
                visualDensity: VisualDensity.compact,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),

          // --- Name field ---
          TextField(
            controller: _nameController,
            textCapitalization: TextCapitalization.words,
            decoration: const InputDecoration(
              labelText: 'Name',
              hintText: 'e.g. Luna, Captain Rex',
            ),
          ),
          const SizedBox(height: AppSpacing.md),

          // --- Personality field with char counter ---
          ValueListenableBuilder<TextEditingValue>(
            valueListenable: _personalityController,
            builder: (context, value, _) {
              final count = value.text.length;
              final overLimit = count > _maxPersonalityChars;
              return TextField(
                controller: _personalityController,
                maxLines: 4,
                maxLength: _maxPersonalityChars,
                decoration: InputDecoration(
                  labelText: 'Personality / Instructions',
                  hintText: 'Describe how this persona speaks and behaves...',
                  counterStyle: AppTypography.caption.copyWith(
                    color: overLimit ? AppColors.error : colors.onSurfaceMuted,
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: AppSpacing.lg),

          // --- AI generation section ---
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: colors.surfaceHigh,
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
              border: Border.all(color: colors.border.withValues(alpha: 0.5)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.auto_awesome_rounded,
                      size: 14,
                      color: colors.primaryLight,
                    ),
                    const SizedBox(width: AppSpacing.xs),
                    Text(
                      'GENERATE WITH AI',
                      style: AppTypography.labelSmall.copyWith(
                        color: colors.primaryLight,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _keywordController,
                        decoration: InputDecoration(
                          hintText: 'e.g. funny pirate, stern scientist',
                          isDense: true,
                          fillColor: colors.surfaceHighest,
                        ),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    SizedBox(
                      width: 44,
                      height: 44,
                      child: FilledButton(
                        onPressed: _isGenerating ? null : _generateAI,
                        style: FilledButton.styleFrom(
                          padding: EdgeInsets.zero,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(
                              AppSpacing.radiusMd,
                            ),
                          ),
                        ),
                        child: _isGenerating
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: AppColors.onPrimary,
                                ),
                              )
                            : const Icon(Icons.auto_awesome_rounded, size: 20),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),

          // --- Save button ---
          FilledButton(
            onPressed: _isSaving ? null : _save,
            child: _isSaving
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppColors.onPrimary,
                    ),
                  )
                : const Text('Save Persona'),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Create Room Sheet (Group Selection)
// ---------------------------------------------------------------------------

class CreateRoomSheet extends StatefulWidget {
  final List<Agent> agents;
  const CreateRoomSheet({super.key, required this.agents});

  @override
  State<CreateRoomSheet> createState() => _CreateRoomSheetState();
}

class _CreateRoomSheetState extends State<CreateRoomSheet> {
  final Set<String> _selectedAgentIds = {};
  final _nameController = TextEditingController();
  bool _isCreating = false;

  void _toggleAgent(String id) {
    setState(() {
      if (_selectedAgentIds.contains(id)) {
        _selectedAgentIds.remove(id);
      } else {
        _selectedAgentIds.add(id);
      }
      _updateDefaultName();
    });
  }

  void _updateDefaultName() {
    if (_selectedAgentIds.isEmpty) {
      _nameController.text = '';
      return;
    }
    final names = widget.agents
        .where((a) => _selectedAgentIds.contains(a.id))
        .map((a) => a.name)
        .toList();
    _nameController.text = names.join(', ');
  }

  Future<void> _create() async {
    if (_selectedAgentIds.isEmpty) return;
    final name = _nameController.text.trim();
    if (name.isEmpty) return;

    setState(() => _isCreating = true);
    try {
      final Map<String, dynamic> roomData = await ApiService.createRoom(name);
      final String roomId = roomData['id'] as String;

      // Add all selected agents
      for (final agentId in _selectedAgentIds) {
        await ApiService.addAgentToRoom(roomId, agentId);
      }

      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to create group: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isCreating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final bottomPadding = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.8,
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
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('New Group', style: AppTypography.headingSmall),
          const SizedBox(height: AppSpacing.md),
          Text(
            'SELECT PERSONAS',
            style: AppTypography.labelSmall.copyWith(
              color: colors.onSurfaceMuted,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Flexible(
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: widget.agents.length,
              itemBuilder: (context, index) {
                final agent = widget.agents[index];
                final isSelected = _selectedAgentIds.contains(agent.id);
                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: colors.primary.withValues(alpha: 0.1),
                    child: Text(agent.name[0].toUpperCase()),
                  ),
                  title: Text(agent.name),
                  trailing: Checkbox(
                    value: isSelected,
                    onChanged: (_) => _toggleAgent(agent.id),
                  ),
                  onTap: () => _toggleAgent(agent.id),
                );
              },
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          TextField(
            controller: _nameController,
            decoration: const InputDecoration(labelText: 'Group Name'),
          ),
          const SizedBox(height: AppSpacing.xl),
          FilledButton(
            onPressed:
                _isCreating || _selectedAgentIds.isEmpty ? null : _create,
            child: _isCreating
                ? const CircularProgressIndicator()
                : const Text('Create Group'),
          ),
        ],
      ),
    );
  }
}
