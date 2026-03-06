import 'package:flutter/material.dart';
import '../extensions/build_context_extensions.dart';
import '../tokens/spacing.dart';

/// A styled container that follows the Miru design system.
///
/// Use instead of raw Container/DecoratedBox for elevated content.
///
/// ```dart
/// AppCard(
///   padding: AppSpacing.paddingAllLg,
///   child: Text('Content'),
/// )
/// ```
class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final Color? color;
  final double borderRadius;
  final bool showBorder;
  final VoidCallback? onTap;

  const AppCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.color,
    this.borderRadius = AppSpacing.radiusMd,
    this.showBorder = true,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    Widget card = Container(
      margin: margin,
      decoration: BoxDecoration(
        color: color ?? colors.surface,
        borderRadius: BorderRadius.circular(borderRadius),
        border: showBorder ? Border.all(color: colors.border, width: 1) : null,
      ),
      padding: padding ?? AppSpacing.cardPadding,
      child: child,
    );

    if (onTap != null) {
      card = GestureDetector(onTap: onTap, child: card);
    }

    return card;
  }
}
