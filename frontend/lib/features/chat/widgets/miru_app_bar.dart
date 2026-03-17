import 'package:flutter/material.dart';

import 'package:miru/core/design_system/design_system.dart';

/// The premium app bar used in the main chat interface.
///
/// It displays the Miru logo, an online status indicator, and provides actions
/// for starting a new chat or accessing the settings page. The title uses a
/// gradient text effect.
class MiruAppBar extends StatelessWidget implements PreferredSizeWidget {
  /// The theme colors to use for the app bar.
  final AppThemeColors colors;

  /// Whether the app is currently in dark mode.
  final bool isDark;

  /// Whether to show the new chat button.
  final bool showNewChat;

  /// Callback when the new chat button is pressed.
  final VoidCallback onNewChat;

  /// Callback when the settings button is pressed.
  final VoidCallback onSettingsPressed;

  /// Creates a [MiruAppBar].
  const MiruAppBar({
    super.key,
    required this.colors,
    required this.isDark,
    required this.showNewChat,
    required this.onNewChat,
    required this.onSettingsPressed,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    // Gradient uses design tokens instead of hardcoded colors.
    final gradientColors = isDark
        ? [AppColors.onSurfaceDark, AppColors.primaryLight]
        : [AppColors.onSurfaceLight, AppColors.primaryDark];

    return AppBar(
      backgroundColor: isDark
          ? AppColors.backgroundDark
          : AppColors.backgroundLight,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: true,
      leading: showNewChat
          ? IconButton(
              icon: Icon(
                Icons.add_rounded,
                color: colors.onSurfaceMuted,
                size: 22,
              ),
              tooltip: 'New chat',
              onPressed: onNewChat,
            )
          : null,
      title: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Icon mark
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              color: colors.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.blur_on_rounded, size: 16, color: colors.primary),
          ),
          const SizedBox(width: AppSpacing.sm),
          // Gradient wordmark
          ShaderMask(
            shaderCallback: (bounds) => LinearGradient(
              colors: gradientColors,
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ).createShader(bounds),
            child: Text(
              'Miru',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w700,
                color: AppColors.surfaceLight,
                letterSpacing: -0.5,
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.xs),
          const AppStatusDot.online(),
        ],
      ),
      actions: [
        IconButton(
          icon: Icon(
            Icons.settings_outlined,
            color: colors.onSurfaceMuted,
            size: 22,
          ),
          onPressed: onSettingsPressed,
          tooltip: 'Settings',
        ),
        const SizedBox(width: AppSpacing.xs),
      ],
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(
          height: 1,
          color: (isDark ? AppColors.borderDark : AppColors.borderLight)
              .withValues(alpha: 0.4),
        ),
      ),
    );
  }
}
