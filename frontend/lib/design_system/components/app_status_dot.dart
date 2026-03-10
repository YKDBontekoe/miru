import 'package:flutter/material.dart';
import '../tokens/colors.dart';
import '../tokens/spacing.dart';

/// A small colored dot indicating status (online, offline, busy, etc.).
///
/// ```dart
/// AppStatusDot.online()
/// AppStatusDot(color: AppColors.warning)
/// ```
class AppStatusDot extends StatelessWidget {
  final Color color;
  final double size;

  const AppStatusDot({
    super.key,
    required this.color,
    this.size = AppSpacing.statusDotSize,
  });

  /// Online (green) indicator.
  const AppStatusDot.online({super.key, this.size = AppSpacing.statusDotSize})
      : color = AppColors.success;

  /// Offline (muted) indicator.
  const AppStatusDot.offline({super.key, this.size = AppSpacing.statusDotSize})
      : color = AppColors.onSurfaceDisabledDark;

  /// Busy/warning indicator.
  const AppStatusDot.busy({super.key, this.size = AppSpacing.statusDotSize})
      : color = AppColors.warning;

  /// Error/offline indicator.
  const AppStatusDot.error({super.key, this.size = AppSpacing.statusDotSize})
      : color = AppColors.error;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
    );
  }
}
