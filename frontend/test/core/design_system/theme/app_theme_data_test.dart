import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:miru/core/design_system/theme/app_theme_data.dart';
import 'package:miru/core/design_system/tokens/colors.dart';

void main() {
  // ---------------------------------------------------------------------------
  // AppTheme
  // ---------------------------------------------------------------------------

  group('AppTheme', () {
    test('light returns a valid ThemeData', () {
      final theme = AppTheme.light;
      expect(theme, isA<ThemeData>());
    });

    test('dark returns a valid ThemeData', () {
      final theme = AppTheme.dark;
      expect(theme, isA<ThemeData>());
    });

    test('light theme uses Material3', () {
      expect(AppTheme.light.useMaterial3, isTrue);
    });

    test('dark theme uses Material3', () {
      expect(AppTheme.dark.useMaterial3, isTrue);
    });

    test('light theme has Brightness.light', () {
      expect(AppTheme.light.colorScheme.brightness, equals(Brightness.light));
    });

    test('dark theme has Brightness.dark', () {
      expect(AppTheme.dark.colorScheme.brightness, equals(Brightness.dark));
    });

    test('light and dark themes are not identical', () {
      expect(AppTheme.light, isNot(same(AppTheme.dark)));
    });

    test('light theme registers AppThemeColors extension', () {
      final extension = AppTheme.light.extension<AppThemeColors>();
      expect(extension, isNotNull);
    });

    test('dark theme registers AppThemeColors extension', () {
      final extension = AppTheme.dark.extension<AppThemeColors>();
      expect(extension, isNotNull);
    });

    test('light theme extension matches AppThemeColors.light()', () {
      final extension = AppTheme.light.extension<AppThemeColors>()!;
      const expected = AppThemeColors.light();
      expect(extension.background, equals(expected.background));
      expect(extension.primary, equals(expected.primary));
      expect(extension.error, equals(expected.error));
    });

    test('dark theme extension matches AppThemeColors.dark()', () {
      final extension = AppTheme.dark.extension<AppThemeColors>()!;
      const expected = AppThemeColors.dark();
      expect(extension.background, equals(expected.background));
      expect(extension.primary, equals(expected.primary));
      expect(extension.error, equals(expected.error));
    });

    test('light colorScheme primary matches AppColors.primary', () {
      expect(
        AppTheme.light.colorScheme.primary,
        equals(AppColors.primary),
      );
    });

    test('dark colorScheme primary matches AppColors.primary', () {
      expect(
        AppTheme.dark.colorScheme.primary,
        equals(AppColors.primary),
      );
    });

    test('light scaffoldBackgroundColor matches AppColors.backgroundLight', () {
      expect(
        AppTheme.light.scaffoldBackgroundColor,
        equals(AppColors.backgroundLight),
      );
    });

    test('dark scaffoldBackgroundColor matches AppColors.backgroundDark', () {
      expect(
        AppTheme.dark.scaffoldBackgroundColor,
        equals(AppColors.backgroundDark),
      );
    });

    test('light theme AppBar has zero elevation', () {
      expect(AppTheme.light.appBarTheme.elevation, equals(0));
    });

    test('dark theme AppBar has zero elevation', () {
      expect(AppTheme.dark.appBarTheme.elevation, equals(0));
    });

    test('light theme AppBar is centered', () {
      expect(AppTheme.light.appBarTheme.centerTitle, isTrue);
    });

    test('dark theme AppBar is centered', () {
      expect(AppTheme.dark.appBarTheme.centerTitle, isTrue);
    });
  });

  // ---------------------------------------------------------------------------
  // AppThemeColors — factory constructors
  // ---------------------------------------------------------------------------

  group('AppThemeColors.dark()', () {
    const colors = AppThemeColors.dark();

    test('background matches AppColors.backgroundDark', () {
      expect(colors.background, equals(AppColors.backgroundDark));
    });

    test('surface matches AppColors.surfaceDark', () {
      expect(colors.surface, equals(AppColors.surfaceDark));
    });

    test('surfaceHigh matches AppColors.surfaceHighDark', () {
      expect(colors.surfaceHigh, equals(AppColors.surfaceHighDark));
    });

    test('surfaceHighest matches AppColors.surfaceHighestDark', () {
      expect(colors.surfaceHighest, equals(AppColors.surfaceHighestDark));
    });

    test('border matches AppColors.borderDark', () {
      expect(colors.border, equals(AppColors.borderDark));
    });

    test('onSurface matches AppColors.onSurfaceDark', () {
      expect(colors.onSurface, equals(AppColors.onSurfaceDark));
    });

    test('primary matches AppColors.primary', () {
      expect(colors.primary, equals(AppColors.primary));
    });

    test('error matches AppColors.error', () {
      expect(colors.error, equals(AppColors.error));
    });

    test('success matches AppColors.success', () {
      expect(colors.success, equals(AppColors.success));
    });
  });

  group('AppThemeColors.light()', () {
    const colors = AppThemeColors.light();

    test('background matches AppColors.backgroundLight', () {
      expect(colors.background, equals(AppColors.backgroundLight));
    });

    test('surface matches AppColors.surfaceLight', () {
      expect(colors.surface, equals(AppColors.surfaceLight));
    });

    test('surfaceHigh matches AppColors.surfaceHighLight', () {
      expect(colors.surfaceHigh, equals(AppColors.surfaceHighLight));
    });

    test('border matches AppColors.borderLight', () {
      expect(colors.border, equals(AppColors.borderLight));
    });

    test('onSurface matches AppColors.onSurfaceLight', () {
      expect(colors.onSurface, equals(AppColors.onSurfaceLight));
    });

    test('primary matches AppColors.primary', () {
      expect(colors.primary, equals(AppColors.primary));
    });

    test('error matches AppColors.error', () {
      expect(colors.error, equals(AppColors.error));
    });
  });

  // ---------------------------------------------------------------------------
  // AppThemeColors — copyWith
  // ---------------------------------------------------------------------------

  group('AppThemeColors.copyWith()', () {
    const original = AppThemeColors.dark();

    test('copyWith with no arguments returns equivalent values', () {
      final copy = original.copyWith();
      expect(copy.background, equals(original.background));
      expect(copy.surface, equals(original.surface));
      expect(copy.primary, equals(original.primary));
      expect(copy.error, equals(original.error));
    });

    test('copyWith overrides the specified field', () {
      const newBackground = Color(0xFF123456);
      final copy = original.copyWith(background: newBackground);
      expect(copy.background, equals(newBackground));
    });

    test('copyWith does not mutate non-overridden fields', () {
      const newBackground = Color(0xFF123456);
      final copy = original.copyWith(background: newBackground);
      expect(copy.surface, equals(original.surface));
      expect(copy.primary, equals(original.primary));
      expect(copy.error, equals(original.error));
      expect(copy.success, equals(original.success));
    });

    test('copyWith can override multiple fields independently', () {
      const newColor1 = Color(0xFFAAAAAA);
      const newColor2 = Color(0xFFBBBBBB);
      final copy = original.copyWith(primary: newColor1, error: newColor2);
      expect(copy.primary, equals(newColor1));
      expect(copy.error, equals(newColor2));
      expect(copy.background, equals(original.background));
    });

    test('copyWith overrides all semantic status colors independently', () {
      const newSuccess = Color(0xFF001100);
      const newWarning = Color(0xFF111100);
      const newInfo = Color(0xFF000011);
      final copy = original.copyWith(
        success: newSuccess,
        warning: newWarning,
        info: newInfo,
      );
      expect(copy.success, equals(newSuccess));
      expect(copy.warning, equals(newWarning));
      expect(copy.info, equals(newInfo));
      // Unchanged fields preserved
      expect(copy.error, equals(original.error));
    });
  });

  // ---------------------------------------------------------------------------
  // AppThemeColors — lerp
  // ---------------------------------------------------------------------------

  group('AppThemeColors.lerp()', () {
    const dark = AppThemeColors.dark();
    const light = AppThemeColors.light();

    test('lerp with null other returns self', () {
      final result = dark.lerp(null, 0.5);
      expect(result.background, equals(dark.background));
      expect(result.primary, equals(dark.primary));
    });

    test('lerp at t=0.0 returns values equal to self', () {
      final result = dark.lerp(light, 0.0);
      expect(result.background, equals(dark.background));
      expect(result.surface, equals(dark.surface));
      expect(result.primary, equals(dark.primary));
    });

    test('lerp at t=1.0 returns values equal to other', () {
      final result = dark.lerp(light, 1.0);
      expect(result.background, equals(light.background));
      expect(result.surface, equals(light.surface));
      expect(result.primary, equals(light.primary));
    });

    test('lerp at t=0.5 produces intermediate color', () {
      final result = dark.lerp(light, 0.5);
      final expected = Color.lerp(dark.background, light.background, 0.5)!;
      expect(result.background, equals(expected));
    });

    test('lerp preserves all color fields at t=1.0', () {
      final result = dark.lerp(light, 1.0);
      expect(result.surfaceHigh, equals(light.surfaceHigh));
      expect(result.border, equals(light.border));
      expect(result.onSurface, equals(light.onSurface));
      expect(result.error, equals(light.error));
      expect(result.success, equals(light.success));
      expect(result.warning, equals(light.warning));
      expect(result.info, equals(light.info));
    });
  });

  // ---------------------------------------------------------------------------
  // AppThemeColors — dark vs light differ for mode-specific tokens
  // ---------------------------------------------------------------------------

  group('AppThemeColors dark vs light differences', () {
    const dark = AppThemeColors.dark();
    const light = AppThemeColors.light();

    test('dark and light backgrounds differ', () {
      expect(dark.background, isNot(equals(light.background)));
    });

    test('dark and light surfaces differ', () {
      expect(dark.surface, isNot(equals(light.surface)));
    });

    test('dark and light onSurface differ', () {
      expect(dark.onSurface, isNot(equals(light.onSurface)));
    });

    test('dark and light borders differ', () {
      expect(dark.border, isNot(equals(light.border)));
    });

    // primary is shared between both modes
    test('dark and light primary are the same brand color', () {
      expect(dark.primary, equals(light.primary));
    });

    test('dark and light error are the same semantic color', () {
      expect(dark.error, equals(light.error));
    });
  });
}