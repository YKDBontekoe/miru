import 'package:flutter/material.dart';
import '../../models/agent.dart';
import '../../design_system/design_system.dart';

class PersonaDetailSheet extends StatefulWidget {
  final Agent agent;
  final VoidCallback onDeleted;

  const PersonaDetailSheet({
    super.key,
    required this.agent,
    required this.onDeleted,
  });

  @override
  State<PersonaDetailSheet> createState() => _PersonaDetailSheetState();
}

class _PersonaDetailSheetState extends State<PersonaDetailSheet> {
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
                : const Icon(Icons.delete_outline_rounded,
                    color: AppColors.error),
            label: const Text(
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
