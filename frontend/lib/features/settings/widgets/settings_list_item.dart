import 'package:flutter/material.dart';
import 'package:miru/core/design_system/design_system.dart';

/// A standardized section header used throughout the settings page to group options.
class SectionHeader extends StatelessWidget {
  final String title;

  const SectionHeader({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.md,
        AppSpacing.lg,
        AppSpacing.sm,
      ),
      child: Text(
        title.toUpperCase(),
        style: AppTypography.labelSmall.copyWith(
          color: context.colors.onSurfaceMuted,
          letterSpacing: 1.2,
        ),
      ),
    );
  }
}

/// A standard list tile for displaying settings options, preferences, or actions.
class SettingTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;
  final bool destructive;

  const SettingTile({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
    this.destructive = false,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final contentColor = destructive ? AppColors.error : colors.onSurface;

    return ListTile(
      leading: Icon(
        icon,
        color: destructive ? AppColors.error : colors.onSurfaceMuted,
        size: AppSpacing.iconMd,
      ),
      title: Text(
        title,
        style: AppTypography.labelLarge.copyWith(color: contentColor),
      ),
      subtitle: subtitle != null
          ? Text(
              subtitle!,
              style: AppTypography.bodySmall.copyWith(
                color: colors.onSurfaceMuted,
              ),
            )
          : null,
      trailing: trailing,
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.xs,
      ),
    );
  }
}
