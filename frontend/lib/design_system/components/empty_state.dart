import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../extensions/build_context_extensions.dart';
import '../tokens/spacing.dart';
import 'onboarding_visuals.dart';

/// A centered empty-state placeholder with a custom animated AI orb, title,
/// and subtitle.
///
/// ```dart
/// AppEmptyState(
///   icon: Icons.auto_awesome_rounded,
///   title: "Hi, I'm Miru.",
///   subtitle: 'I remember things about you over time.\nTell me something!',
/// )
/// ```
class AppEmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? action;

  const AppEmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.action,
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
              // Glowing animated orb
              const MiruOrbVisual(size: 160),

              const SizedBox(height: AppSpacing.xl),

              // Title — gradient adapts to theme
              ShaderMask(
                shaderCallback: (bounds) {
                  final isDark = context.isDark;
                  return LinearGradient(
                    colors: isDark
                        ? const [Color(0xFFFFFFFF), Color(0xFFADB5FA)]
                        : const [Color(0xFF12121A), Color(0xFF4F46E5)],
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
