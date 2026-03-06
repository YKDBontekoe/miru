import 'package:flutter/material.dart';

import '../tokens/colors.dart';
import '../tokens/spacing.dart';
import '../tokens/typography.dart';

/// Displays a small pill badge indicating the CrewAI task type that was used
/// to generate a message (e.g. "research", "planning", "summarisation").
///
/// ```dart
/// CrewTaskBadge(taskType: 'research')
/// ```
class CrewTaskBadge extends StatelessWidget {
  final String taskType;

  const CrewTaskBadge({super.key, required this.taskType});

  _TaskStyle get _style {
    switch (taskType.toLowerCase()) {
      case 'research':
        return const _TaskStyle(
          label: 'Research',
          icon: Icons.search_rounded,
          color: AppColors.info,
          surface: AppColors.infoSurface,
        );
      case 'planning':
        return const _TaskStyle(
          label: 'Planning',
          icon: Icons.checklist_rounded,
          color: AppColors.warning,
          surface: AppColors.warningSurface,
        );
      case 'summarisation':
        return const _TaskStyle(
          label: 'Summary',
          icon: Icons.notes_rounded,
          color: AppColors.success,
          surface: AppColors.successSurface,
        );
      default:
        return const _TaskStyle(
          label: 'Crew',
          icon: Icons.groups_rounded,
          color: AppColors.primaryLight,
          surface: AppColors.primarySurface,
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = _style;
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
