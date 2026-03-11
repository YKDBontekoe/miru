import 'package:flutter/material.dart';
import '../../models/chat_room.dart';
import '../../models/agent.dart';
import '../../design_system/design_system.dart';

class RoomCard extends StatelessWidget {
  final ChatRoom room;
  final List<Agent> agents;
  final VoidCallback onTap;

  const RoomCard({
    super.key,
    required this.room,
    required this.agents,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final textTheme = context.textTheme;

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
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      room.name.isNotEmpty ? room.name[0].toUpperCase() : 'R',
                      style: textTheme.titleMedium?.copyWith(
                        color: colors.primary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                // Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        room.name.isEmpty ? 'Untitled Room' : room.name,
                        style: textTheme.titleMedium,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        _buildAgentsText(agents),
                        style: AppTypography.bodySmall.copyWith(
                          color: colors.onSurfaceMuted,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                // Arrow
                Icon(
                  Icons.chevron_right_rounded,
                  color: colors.onSurfaceDisabled,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _buildAgentsText(List<Agent> agents) {
    if (agents.isEmpty) return 'No personas yet';
    if (agents.length == 1) return 'You & ${agents[0].name}';
    if (agents.length == 2) {
      return 'You, ${agents[0].name} & ${agents[1].name}';
    }
    return 'You + ${agents.length} personas';
  }
}
