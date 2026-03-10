import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../extensions/build_context_extensions.dart';
import '../theme/app_theme_data.dart';
import '../tokens/colors.dart';
import '../tokens/spacing.dart';
import '../tokens/typography.dart';
import 'onboarding_visuals.dart';

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
class AppEmptyState extends StatelessWidget {
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

              // Title -- gradient adapts to theme
              ShaderMask(
                shaderCallback: (bounds) {
                  final isDark = context.isDark;
                  return LinearGradient(
                    colors: isDark
                        ? [AppColors.onSurfaceDark, AppColors.primaryLight]
                        : [AppColors.onSurfaceLight, AppColors.primaryDark],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ).createShader(bounds);
                },
                child: Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 26,
                    fontWeight: FontWeight.w700,
                    height: 1.2,
                    color: Colors.white, // ShaderMask paints over this
                  ),
                  textAlign: TextAlign.center,
                ),
              ),

              // Subtitle
              if (subtitle != null) ...[
                const SizedBox(height: AppSpacing.md),
                Text(
                  subtitle!,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w400,
                    height: 1.6,
                    color: colors.onSurfaceMuted,
                  ),
                ),
              ],

              // Suggestion chips
              if (suggestions.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.xxl),
                _SuggestionChips(
                  suggestions: suggestions,
                  onTap: onSuggestionTap,
                  colors: colors,
                ),
              ],

              // Optional action
              if (action != null) ...[
                const SizedBox(height: AppSpacing.xxl),
                action!,
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
