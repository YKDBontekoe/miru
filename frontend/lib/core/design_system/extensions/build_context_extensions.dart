import 'package:flutter/material.dart';
import 'package:miru/core/design_system/theme/app_theme_data.dart';

/// Convenient BuildContext extensions for accessing design system tokens.
///
/// Usage:
///   context.colors.primary
///   context.isDark
///   context.screenWidth
extension AppBuildContext on BuildContext {
  /// Access the current [ThemeData].
  ThemeData get theme => Theme.of(this);

  /// Access the current [ColorScheme].
  ColorScheme get colorScheme => theme.colorScheme;

  /// Access the custom [AppThemeColors] extension.
  AppThemeColors get colors => theme.extension<AppThemeColors>()!;

  /// Access the current [TextTheme].
  TextTheme get textTheme => theme.textTheme;

  /// Whether the current theme is dark.
  bool get isDark => theme.brightness == Brightness.dark;

  /// Screen width.
  double get screenWidth => MediaQuery.sizeOf(this).width;

  /// Screen height.
  double get screenHeight => MediaQuery.sizeOf(this).height;

  /// Bottom padding (safe area).
  double get bottomPadding => MediaQuery.paddingOf(this).bottom;
}
