import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:miru/core/api/api_service.dart';
import 'package:miru/core/models/chat_room.dart';
import 'package:miru/core/models/agent.dart';
import 'package:miru/features/rooms/pages/group_chat_page.dart';
import 'package:miru/features/rooms/widgets/persona_detail_sheet.dart';
import 'package:miru/features/rooms/widgets/create_persona_sheet.dart';
import 'package:miru/features/rooms/widgets/create_room_sheet.dart';
import 'package:miru/core/design_system/design_system.dart';

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
          _rooms = data;
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
          _agents = data;
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
      backgroundColor: AppColors.transparent,
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
      backgroundColor: AppColors.transparent,
      builder: (context) =>
          CreateRoomSheet(availableAgents: _agents, onRoomCreated: _loadRooms),
    );
  }

  void _showPersonaDetail(Agent agent) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.transparent,
      builder: (context) =>
          PersonaDetailSheet(agent: agent, onDeleted: _loadAgents),
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
        child: Material(
          color: colors.surfaceHigh,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
            side: BorderSide(color: colors.border.withValues(alpha: 0.5)),
          ),
          clipBehavior: Clip.hardEdge,
          child: InkWell(
            onTap: _showCreatePersonaDialog,
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
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
            child: Container(
              width: 84,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                boxShadow: AppShadows.sm,
              ),
              child: Material(
                color: colors.surfaceHigh,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                  side: BorderSide(color: colors.border.withValues(alpha: 0.5)),
                ),
                clipBehavior: Clip.hardEdge,
                child: InkWell(
                  onTap: () => _showPersonaDetail(agent),
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.xs),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircleAvatar(
                          radius: 22,
                          backgroundColor: colors.primaryLight.withValues(
                            alpha: 0.15,
                          ),
                          backgroundImage: agent.avatarImage,
                          child: agent.avatarUrl == null
                              ? null
                              : Text(
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
