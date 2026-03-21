import 'package:flutter/material.dart';
import 'package:miru/core/design_system/design_system.dart';

/// A small animated pill that shows the current processing status.
class StatusPill extends StatefulWidget {
  final String label;
  final AppThemeColors colors;

  const StatusPill({super.key, required this.label, required this.colors});

  @override
  State<StatusPill> createState() => _StatusPillState();
}

class _StatusPillState extends State<StatusPill>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _fade;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    )..repeat(reverse: true);
    _fade = Tween<double>(begin: 0.5, end: 1.0).animate(_controller);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.xs),
      child: FadeTransition(
        opacity: _fade,
        child: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.sm,
            vertical: AppSpacing.xxs,
          ),
          decoration: BoxDecoration(
            color: widget.colors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(AppSpacing.sm),
            border: Border.all(
              color: widget.colors.primary.withValues(alpha: 0.25),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                width: AppSpacing.sm,
                height: AppSpacing.sm,
                child: CircularProgressIndicator(
                  strokeWidth: 1.5,
                  color: widget.colors.primary,
                ),
              ),
              const SizedBox(width: AppSpacing.xs),
              Text(
                widget.label,
                style: AppTypography.caption.copyWith(
                  color: widget.colors.primary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
