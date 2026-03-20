import 'package:flutter/material.dart';
import 'package:miru/core/design_system/design_system.dart';
import 'package:miru/core/models/memory.dart';
import 'package:miru/core/utils/date_utils.dart';

/// A list tile widget representing a single personal memory learned by Miru.
class MemoryListItem extends StatelessWidget {
  final Memory memory;
  final VoidCallback onDelete;

  const MemoryListItem({
    super.key,
    required this.memory,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return ListTile(
      leading: Icon(
        Icons.auto_awesome_rounded,
        color: colors.primary,
        size: 20,
      ),
      title: Text(
        memory.content,
        style: AppTypography.bodyMedium.copyWith(color: colors.onSurface),
      ),
      subtitle: Text(
        'Learned ${AppDateUtils.formatDate(memory.createdAt)}',
        style: AppTypography.bodySmall.copyWith(color: colors.onSurfaceMuted),
      ),
      trailing: IconButton(
        icon: Icon(
          Icons.delete_outline_rounded,
          color: colors.onSurfaceMuted,
          size: 20,
        ),
        onPressed: onDelete,
        tooltip: 'Forget memory',
      ),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.xs,
      ),
    );
  }
}
