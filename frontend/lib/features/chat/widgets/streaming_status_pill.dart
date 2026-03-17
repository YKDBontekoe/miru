import 'package:flutter/material.dart';

import 'package:miru/core/design_system/design_system.dart';

/// A pulsing pill indicator showing the current status of the streaming response.
///
/// It visually communicates backend actions like "Thinking..." or "Recalling memories..."
/// with a subtle pulse animation.
class StreamingStatusPill extends StatefulWidget {
  /// The text label displaying the current status.
  final String label;

  /// Creates a [StreamingStatusPill].
  const StreamingStatusPill({super.key, required this.label});

  @override
  State<StreamingStatusPill> createState() => _StreamingStatusPillState();
}

class _StreamingStatusPillState extends State<StreamingStatusPill>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulse;
  late final Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    _pulse = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);
    _opacity = Tween<double>(
      begin: 0.5,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _pulse, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final isDark = context.isDark;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.xs),
      child: FadeTransition(
        opacity: _opacity,
        child: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.xs,
          ),
          decoration: BoxDecoration(
            color: isDark
                ? AppColors.surfaceHighDark
                : AppColors.surfaceHighLight,
            borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
            border: Border.all(
              color: colors.border.withValues(alpha: 0.5),
              width: 1,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                width: 10,
                height: 10,
                child: CircularProgressIndicator(
                  strokeWidth: 1.5,
                  valueColor: AlwaysStoppedAnimation<Color>(colors.primary),
                ),
              ),
              const SizedBox(width: AppSpacing.xs),
              Text(
                widget.label,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.w500,
                  color: colors.onSurfaceMuted,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
