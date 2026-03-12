import 'package:flutter/material.dart';

import 'package:miru/core/design_system/extensions/build_context_extensions.dart';
import 'package:miru/core/design_system/tokens/spacing.dart';
import 'package:miru/core/design_system/tokens/typography.dart';

/// Displays a small pill badge indicating the CrewAI task type that was used
/// to generate a message (e.g. "research", "planning", "summarisation").
///
/// ```dart
/// CrewTaskBadge(taskType: 'research')
/// ```
class CrewTaskBadge extends StatelessWidget {
  final String taskType;

  const CrewTaskBadge({super.key, required this.taskType});

  _TaskStyle _resolveStyle(BuildContext context) {
    final colors = context.colors;
    switch (taskType.toLowerCase()) {
      case 'research':
        return _TaskStyle(
          label: 'Research',
          icon: Icons.search_rounded,
          color: colors.info,
          surface: colors.infoSurface,
        );
      case 'planning':
        return _TaskStyle(
          label: 'Planning',
          icon: Icons.checklist_rounded,
          color: colors.warning,
          surface: colors.warningSurface,
        );
      case 'summarisation':
        return _TaskStyle(
          label: 'Summary',
          icon: Icons.notes_rounded,
          color: colors.success,
          surface: colors.successSurface,
        );
      default:
        return _TaskStyle(
          label: 'Crew',
          icon: Icons.groups_rounded,
          color: colors.primaryLight,
          surface: colors.primarySurface,
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = _resolveStyle(context);
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xxs,
      ),
      decoration: BoxDecoration(
        color: s.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
        border: Border.all(color: s.color.withAlpha(60)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(s.icon, size: 11, color: s.color),
          const SizedBox(width: 4),
          Text(
            s.label,
            style: AppTypography.captionSmall.copyWith(
              color: s.color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _TaskStyle {
  final String label;
  final IconData icon;
  final Color color;
  final Color surface;

  const _TaskStyle({
    required this.label,
    required this.icon,
    required this.color,
    required this.surface,
  });
}
