import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../tokens/colors.dart';
import '../tokens/typography.dart';
import '../tokens/spacing.dart';

/// Miru Design System -- Theme Builder
///
/// Builds complete [ThemeData] instances for dark and light modes,
/// wiring all design tokens into Flutter's theming infrastructure.
abstract final class AppTheme {
  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /// Light theme (default).
  static ThemeData get light => _buildTheme(Brightness.light);

  /// Dark theme.
  static ThemeData get dark => _buildTheme(Brightness.dark);

  // ---------------------------------------------------------------------------
  // Builder
  // ---------------------------------------------------------------------------

  static ThemeData _buildTheme(Brightness brightness) {
    final isDark = brightness == Brightness.dark;

    final colors =
        isDark ? const AppThemeColors.dark() : const AppThemeColors.light();

    final colorScheme = isDark
        ? const ColorScheme.dark(
            primary: AppColors.primary,
            onPrimary: AppColors.onPrimary,
            secondary: AppColors.primaryLight,
            onSecondary: AppColors.onPrimary,
            error: AppColors.error,
            onError: AppColors.onError,
            surface: AppColors.surfaceDark,
            onSurface: AppColors.onSurfaceDark,
            surfaceContainerHighest: AppColors.surfaceHighestDark,
          )
        : const ColorScheme.light(
            primary: AppColors.primary,
            onPrimary: AppColors.onPrimary,
            secondary: AppColors.primaryLight,
            onSecondary: AppColors.onPrimary,
            error: AppColors.error,
            onError: AppColors.onError,
            surface: AppColors.surfaceLight,
            onSurface: AppColors.onSurfaceLight,
            surfaceContainerHighest: AppColors.surfaceHighestLight,
          );

    final textTheme = _buildTextTheme(
      isDark ? AppColors.onSurfaceDark : AppColors.onSurfaceLight,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: colorScheme,
      textTheme: textTheme,
      scaffoldBackgroundColor: colors.background,
      dividerColor: colors.border,
      splashFactory: InkSparkle.splashFactory,

      // Extensions
      extensions: [colors],

      // AppBar
      appBarTheme: AppBarTheme(
        backgroundColor: colors.surfaceHigh,
        foregroundColor: colors.onSurface,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        titleTextStyle: AppTypography.headingMedium.copyWith(
          color: colors.onSurface,
        ),
        systemOverlayStyle:
            isDark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
      ),

      // Card
      cardTheme: CardThemeData(
        color: colors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          side: BorderSide(color: colors.border, width: 1),
        ),
        margin: EdgeInsets.zero,
      ),

      // Input / TextField
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: colors.surface,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        hintStyle: AppTypography.bodyMedium.copyWith(
          color: colors.onSurfaceMuted,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusXxl),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusXxl),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusXxl),
          borderSide: BorderSide(
            color: AppColors.primary.withAlpha(128),
            width: 1.5,
          ),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusXxl),
          borderSide: const BorderSide(color: AppColors.error, width: 1),
        ),
      ),

      // Elevated Button
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.onPrimary,
          elevation: 0,
          minimumSize: const Size(0, AppSpacing.buttonHeight),
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusXxl),
          ),
          textStyle: AppTypography.labelLarge,
        ),
      ),

      // Outlined Button
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          elevation: 0,
          minimumSize: const Size(0, AppSpacing.buttonHeight),
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusXxl),
          ),
          side: const BorderSide(color: AppColors.primary, width: 1.5),
          textStyle: AppTypography.labelLarge,
        ),
      ),

      // Text Button
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primary,
          minimumSize: const Size(0, AppSpacing.buttonHeightSm),
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
          ),
          textStyle: AppTypography.labelMedium,
        ),
      ),

      // Icon Button
      iconButtonTheme: IconButtonThemeData(
        style: IconButton.styleFrom(
          foregroundColor: colors.onSurface,
          minimumSize: const Size(
            AppSpacing.buttonHeight,
            AppSpacing.buttonHeight,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          ),
        ),
      ),

      // Floating Action Button
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.onPrimary,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        ),
      ),

      // Chip
      chipTheme: ChipThemeData(
        backgroundColor: colors.surfaceHigh,
        labelStyle: AppTypography.labelSmall.copyWith(color: colors.onSurface),
        side: BorderSide(color: colors.border),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm,
          vertical: AppSpacing.xs,
        ),
      ),

      // Dialog
      dialogTheme: DialogThemeData(
        backgroundColor: colors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          side: BorderSide(color: colors.border, width: 1),
        ),
        titleTextStyle: AppTypography.headingSmall.copyWith(
          color: colors.onSurface,
        ),
        contentTextStyle: AppTypography.bodyMedium.copyWith(
          color: colors.onSurfaceMuted,
        ),
      ),

      // Bottom Sheet
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: colors.surface,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(AppSpacing.radiusLg),
          ),
        ),
        showDragHandle: true,
        dragHandleColor: colors.border,
      ),

      // Snackbar
      snackBarTheme: SnackBarThemeData(
        backgroundColor: colors.surfaceHighest,
        contentTextStyle: AppTypography.bodySmall.copyWith(
          color: colors.onSurface,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        ),
        behavior: SnackBarBehavior.floating,
      ),

      // Divider
      dividerTheme: DividerThemeData(
        color: colors.border,
        thickness: 1,
        space: 1,
      ),

      // Tooltip
      tooltipTheme: TooltipThemeData(
        decoration: BoxDecoration(
          color: colors.surfaceHighest,
          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
          border: Border.all(color: colors.border),
        ),
        textStyle: AppTypography.caption.copyWith(color: colors.onSurface),
      ),

      // Progress Indicator
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: AppColors.primary,
        linearTrackColor: colors.primarySurface,
      ),

      // Switch
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return AppColors.onPrimary;
          }
          return colors.onSurfaceMuted;
        }),
        trackColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return AppColors.primary;
          }
          return colors.surfaceHighest;
        }),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Text Theme
  // ---------------------------------------------------------------------------

  static TextTheme _buildTextTheme(Color defaultColor) {
    final notoSans = GoogleFonts.notoSansTextTheme().copyWith(
      displayLarge: AppTypography.displayLarge.copyWith(color: defaultColor),
      displayMedium: AppTypography.displayMedium.copyWith(color: defaultColor),
      displaySmall: AppTypography.displaySmall.copyWith(color: defaultColor),
      headlineLarge: AppTypography.headingLarge.copyWith(color: defaultColor),
      headlineMedium: AppTypography.headingMedium.copyWith(color: defaultColor),
      headlineSmall: AppTypography.headingSmall.copyWith(color: defaultColor),
      titleLarge: AppTypography.headingSmall.copyWith(color: defaultColor),
      titleMedium: AppTypography.labelLarge.copyWith(color: defaultColor),
      titleSmall: AppTypography.labelMedium.copyWith(color: defaultColor),
      bodyLarge: AppTypography.bodyLarge.copyWith(color: defaultColor),
      bodyMedium: AppTypography.bodyMedium.copyWith(color: defaultColor),
      bodySmall: AppTypography.bodySmall.copyWith(color: defaultColor),
      labelLarge: AppTypography.labelLarge.copyWith(color: defaultColor),
      labelMedium: AppTypography.labelMedium.copyWith(color: defaultColor),
      labelSmall: AppTypography.labelSmall.copyWith(color: defaultColor),
    );
    return notoSans;
  }
}

// =============================================================================
// Theme Extension -- Custom color slots
// =============================================================================

/// Custom theme extension that provides Miru-specific semantic colors
/// beyond what [ColorScheme] offers.
///
/// Access via: `Theme.of(context).extension<AppThemeColors>()!`
/// Or with the convenience getter: `context.colors`
class AppThemeColors extends ThemeExtension<AppThemeColors> {
  final Color background;
  final Color surface;
  final Color surfaceHigh;
  final Color surfaceHighest;
  final Color border;
  final Color onSurface;
  final Color onSurfaceMuted;
  final Color onSurfaceDisabled;
  final Color primary;
  final Color primaryLight;
  final Color primarySurface;
  final Color userBubble;
  final Color assistantBubble;
  final Color success;
  final Color successSurface;
  final Color warning;
  final Color warningSurface;
  final Color error;
  final Color errorSurface;
  final Color info;
  final Color infoSurface;

  const AppThemeColors({
    required this.background,
    required this.surface,
    required this.surfaceHigh,
    required this.surfaceHighest,
    required this.border,
    required this.onSurface,
    required this.onSurfaceMuted,
    required this.onSurfaceDisabled,
    required this.primary,
    required this.primaryLight,
    required this.primarySurface,
    required this.userBubble,
    required this.assistantBubble,
    required this.success,
    required this.successSurface,
    required this.warning,
    required this.warningSurface,
    required this.error,
    required this.errorSurface,
    required this.info,
    required this.infoSurface,
  });

  /// Dark mode color set.
  const AppThemeColors.dark()
      : background = AppColors.backgroundDark,
        surface = AppColors.surfaceDark,
        surfaceHigh = AppColors.surfaceHighDark,
        surfaceHighest = AppColors.surfaceHighestDark,
        border = AppColors.borderDark,
        onSurface = AppColors.onSurfaceDark,
        onSurfaceMuted = AppColors.onSurfaceMutedDark,
        onSurfaceDisabled = AppColors.onSurfaceDisabledDark,
        primary = AppColors.primary,
        primaryLight = AppColors.primaryLight,
        primarySurface = AppColors.primarySurface,
        userBubble = AppColors.userBubbleDark,
        assistantBubble = AppColors.assistantBubbleDark,
        success = AppColors.success,
        successSurface = AppColors.successSurfaceDark,
        warning = AppColors.warning,
        warningSurface = AppColors.warningSurfaceDark,
        error = AppColors.error,
        errorSurface = AppColors.errorSurfaceDark,
        info = AppColors.info,
        infoSurface = AppColors.infoSurfaceDark;

  /// Light mode color set.
  const AppThemeColors.light()
      : background = AppColors.backgroundLight,
        surface = AppColors.surfaceLight,
        surfaceHigh = AppColors.surfaceHighLight,
        surfaceHighest = AppColors.surfaceHighestLight,
        border = AppColors.borderLight,
        onSurface = AppColors.onSurfaceLight,
        onSurfaceMuted = AppColors.onSurfaceMutedLight,
        onSurfaceDisabled = AppColors.onSurfaceDisabledLight,
        primary = AppColors.primary,
        primaryLight = AppColors.primaryLight,
        primarySurface = AppColors.primarySurfaceLight,
        userBubble = AppColors.userBubbleLight,
        assistantBubble = AppColors.assistantBubbleLight,
        success = AppColors.success,
        successSurface = AppColors.successSurfaceLight,
        warning = AppColors.warning,
        warningSurface = AppColors.warningSurfaceLight,
        error = AppColors.error,
        errorSurface = AppColors.errorSurfaceLight,
        info = AppColors.info,
        infoSurface = AppColors.infoSurfaceLight;

  @override
  AppThemeColors copyWith({
    Color? background,
    Color? surface,
    Color? surfaceHigh,
    Color? surfaceHighest,
    Color? border,
    Color? onSurface,
    Color? onSurfaceMuted,
    Color? onSurfaceDisabled,
    Color? primary,
    Color? primaryLight,
    Color? primarySurface,
    Color? userBubble,
    Color? assistantBubble,
    Color? success,
    Color? successSurface,
    Color? warning,
    Color? warningSurface,
    Color? error,
    Color? errorSurface,
    Color? info,
    Color? infoSurface,
  }) {
    return AppThemeColors(
      background: background ?? this.background,
      surface: surface ?? this.surface,
      surfaceHigh: surfaceHigh ?? this.surfaceHigh,
      surfaceHighest: surfaceHighest ?? this.surfaceHighest,
      border: border ?? this.border,
      onSurface: onSurface ?? this.onSurface,
      onSurfaceMuted: onSurfaceMuted ?? this.onSurfaceMuted,
      onSurfaceDisabled: onSurfaceDisabled ?? this.onSurfaceDisabled,
      primary: primary ?? this.primary,
      primaryLight: primaryLight ?? this.primaryLight,
      primarySurface: primarySurface ?? this.primarySurface,
      userBubble: userBubble ?? this.userBubble,
      assistantBubble: assistantBubble ?? this.assistantBubble,
      success: success ?? this.success,
      successSurface: successSurface ?? this.successSurface,
      warning: warning ?? this.warning,
      warningSurface: warningSurface ?? this.warningSurface,
      error: error ?? this.error,
      errorSurface: errorSurface ?? this.errorSurface,
      info: info ?? this.info,
      infoSurface: infoSurface ?? this.infoSurface,
    );
  }

  @override
  AppThemeColors lerp(AppThemeColors? other, double t) {
    if (other == null) return this;
    return AppThemeColors(
      background: Color.lerp(background, other.background, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      surfaceHigh: Color.lerp(surfaceHigh, other.surfaceHigh, t)!,
      surfaceHighest: Color.lerp(surfaceHighest, other.surfaceHighest, t)!,
      border: Color.lerp(border, other.border, t)!,
      onSurface: Color.lerp(onSurface, other.onSurface, t)!,
      onSurfaceMuted: Color.lerp(onSurfaceMuted, other.onSurfaceMuted, t)!,
      onSurfaceDisabled: Color.lerp(
        onSurfaceDisabled,
        other.onSurfaceDisabled,
        t,
      )!,
      primary: Color.lerp(primary, other.primary, t)!,
      primaryLight: Color.lerp(primaryLight, other.primaryLight, t)!,
      primarySurface: Color.lerp(primarySurface, other.primarySurface, t)!,
      userBubble: Color.lerp(userBubble, other.userBubble, t)!,
      assistantBubble: Color.lerp(assistantBubble, other.assistantBubble, t)!,
      success: Color.lerp(success, other.success, t)!,
      successSurface: Color.lerp(successSurface, other.successSurface, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      warningSurface: Color.lerp(warningSurface, other.warningSurface, t)!,
      error: Color.lerp(error, other.error, t)!,
      errorSurface: Color.lerp(errorSurface, other.errorSurface, t)!,
      info: Color.lerp(info, other.info, t)!,
      infoSurface: Color.lerp(infoSurface, other.infoSurface, t)!,
    );
  }
}
