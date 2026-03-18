import 'package:flutter/material.dart';

import 'package:miru/core/design_system/design_system.dart';

/// A centered empty-state placeholder with a custom animated AI orb, title,
/// subtitle, and optional suggestion chips.
///
/// ```dart
/// AppEmptyState(
///   title: "Hi, I'm Miru.",
///   subtitle: 'I remember things about you over time.\nTell me something!',
///   suggestions: ['What can you help with?', 'Tell me a joke'],
///   onSuggestionTap: (text) => _sendMessage(text),
/// )
/// ```
class AppEmptyState extends StatefulWidget {
  final String title;
  final String? subtitle;
  final Widget? action;

  /// Optional list of suggestion prompts displayed as tappable chips.
  final List<String> suggestions;

  /// Called when the user taps a suggestion chip.
  final ValueChanged<String>? onSuggestionTap;

  const AppEmptyState({
    super.key,
    required this.title,
    this.subtitle,
    this.action,
    this.suggestions = const [],
    this.onSuggestionTap,
  });

  @override
  State<AppEmptyState> createState() => _AppEmptyStateState();
}

class _AppEmptyStateState extends State<AppEmptyState>
    with SingleTickerProviderStateMixin {
  late final AnimationController _shimmerController;

  @override
  void initState() {
    super.initState();
    _shimmerController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat();
  }

  @override
  void dispose() {
    _shimmerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Center(
      child: SingleChildScrollView(
        child: Padding(
          padding: AppSpacing.paddingAllXxl,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Sleek icon logo
              Container(
                padding: const EdgeInsets.all(AppSpacing.xl),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.blur_on_rounded,
                  size: 64,
                  color: AppColors.primary,
                ),
              ),

              const SizedBox(height: AppSpacing.xl),

              // Title -- animated shimmer gradient adapts to theme
              AnimatedBuilder(
                animation: _shimmerController,
                builder: (context, child) {
                  final isDark = context.isDark;
                  return ShaderMask(
                    shaderCallback: (bounds) {
                      return LinearGradient(
                        colors: isDark
                            ? [
                                AppColors.onSurfaceDark,
                                AppColors.primaryLight,
                                AppColors.onSurfaceDark,
                              ]
                            : [
                                AppColors.onSurfaceLight,
                                AppColors.primaryDark,
                                AppColors.onSurfaceLight,
                              ],
                        stops: [
                          (_shimmerController.value - 0.3).clamp(0.0, 1.0),
                          _shimmerController.value.clamp(0.0, 1.0),
                          (_shimmerController.value + 0.3).clamp(0.0, 1.0),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ).createShader(bounds);
                    },
                    child: Text(
                      widget.title,
                      style: AppTypography.headingLarge.copyWith(
                        color: Colors.white,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  );
                },
              ),

              // Subtitle
              if (widget.subtitle != null) ...[
                const SizedBox(height: AppSpacing.md),
                Text(
                  widget.subtitle!,
                  textAlign: TextAlign.center,
                  style: AppTypography.bodyMedium.copyWith(
                    color: colors.onSurfaceMuted,
                  ),
                ),
              ],

              // Suggestion chips
              if (widget.suggestions.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.xxl),
                _SuggestionChips(
                  suggestions: widget.suggestions,
                  onTap: widget.onSuggestionTap,
                  colors: colors,
                ),
              ],

              // Optional action
              if (widget.action != null) ...[
                const SizedBox(height: AppSpacing.xxl),
                widget.action!,
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Suggestion chips grid
// ---------------------------------------------------------------------------

class _SuggestionChips extends StatelessWidget {
  final List<String> suggestions;
  final ValueChanged<String>? onTap;
  final AppThemeColors colors;

  const _SuggestionChips({
    required this.suggestions,
    required this.onTap,
    required this.colors,
  });

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: AppSpacing.sm,
      runSpacing: AppSpacing.sm,
      alignment: WrapAlignment.center,
      children: suggestions.map((text) {
        return Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap != null ? () => onTap!(text) : null,
            borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.lg,
                vertical: AppSpacing.sm,
              ),
              decoration: BoxDecoration(
                color: colors.surfaceHigh,
                borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
                border: Border.all(color: colors.border),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.auto_awesome_rounded,
                    size: AppSpacing.iconSm,
                    color: AppColors.primary,
                  ),
                  const SizedBox(width: AppSpacing.xs),
                  Flexible(
                    child: Text(
                      text,
                      style: AppTypography.labelSmall.copyWith(
                        color: colors.onSurface,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
