import 'package:flutter/material.dart';
import 'package:miru/core/design_system/design_system.dart';

class ScrollToBottomButton extends StatelessWidget {
  final VoidCallback onPressed;
  final AppThemeColors colors;

  const ScrollToBottomButton({
    super.key,
    required this.onPressed,
    required this.colors,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: colors.surfaceHigh,
      elevation: 4,
      shadowColor: Colors.black.withValues(alpha: 0.15),
      shape: const CircleBorder(),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onPressed,
        child: Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: colors.border.withValues(alpha: 0.6)),
          ),
          child: Icon(
            Icons.keyboard_arrow_down_rounded,
            color: colors.onSurfaceMuted,
            size: AppSpacing.iconMd,
          ),
        ),
      ),
    );
  }
}
