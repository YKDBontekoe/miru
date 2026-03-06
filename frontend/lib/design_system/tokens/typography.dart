import 'package:flutter/material.dart';

/// Miru Design System -- Typography Scale
///
/// A strict typographic hierarchy. All text in the app must use one of these
/// styles. Never create ad-hoc TextStyle instances outside this file.
///
/// The scale follows a minor-third progression (1.2x) for font sizes,
/// paired with intentional weight and height values.
abstract final class AppTypography {
  // ---------------------------------------------------------------------------
  // Font family
  // ---------------------------------------------------------------------------

  /// Primary font family. Uses system default (San Francisco on iOS,
  /// Roboto on Android). Change this to a custom font family name to
  /// override globally.
  static const String fontFamily = '.SF Pro Text';

  // ---------------------------------------------------------------------------
  // Display -- Hero headers, splash screens
  // ---------------------------------------------------------------------------

  static const TextStyle displayLarge = TextStyle(
    fontSize: 40,
    fontWeight: FontWeight.w700,
    height: 1.2,
    letterSpacing: -1.0,
  );

  static const TextStyle displayMedium = TextStyle(
    fontSize: 32,
    fontWeight: FontWeight.w700,
    height: 1.2,
    letterSpacing: -0.5,
  );

  static const TextStyle displaySmall = TextStyle(
    fontSize: 28,
    fontWeight: FontWeight.w600,
    height: 1.25,
    letterSpacing: -0.25,
  );

  // ---------------------------------------------------------------------------
  // Heading -- Section headers, page titles
  // ---------------------------------------------------------------------------

  static const TextStyle headingLarge = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.w700,
    height: 1.3,
    letterSpacing: -0.2,
  );

  static const TextStyle headingMedium = TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.w600,
    height: 1.3,
    letterSpacing: -0.1,
  );

  static const TextStyle headingSmall = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w600,
    height: 1.35,
    letterSpacing: 0,
  );

  // ---------------------------------------------------------------------------
  // Body -- Primary content text
  // ---------------------------------------------------------------------------

  static const TextStyle bodyLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w400,
    height: 1.5,
    letterSpacing: 0,
  );

  static const TextStyle bodyMedium = TextStyle(
    fontSize: 15,
    fontWeight: FontWeight.w400,
    height: 1.45,
    letterSpacing: 0,
  );

  static const TextStyle bodySmall = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 1.4,
    letterSpacing: 0.1,
  );

  // ---------------------------------------------------------------------------
  // Label -- Buttons, chips, badges, form labels
  // ---------------------------------------------------------------------------

  static const TextStyle labelLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    height: 1.3,
    letterSpacing: 0.1,
  );

  static const TextStyle labelMedium = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    height: 1.3,
    letterSpacing: 0.2,
  );

  static const TextStyle labelSmall = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w600,
    height: 1.3,
    letterSpacing: 0.3,
  );

  // ---------------------------------------------------------------------------
  // Caption -- Helper text, timestamps, metadata
  // ---------------------------------------------------------------------------

  static const TextStyle caption = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    height: 1.3,
    letterSpacing: 0.2,
  );

  static const TextStyle captionSmall = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w400,
    height: 1.3,
    letterSpacing: 0.3,
  );

  // ---------------------------------------------------------------------------
  // Monospace -- Code blocks, technical content
  // ---------------------------------------------------------------------------

  static const TextStyle code = TextStyle(
    fontFamily: 'SF Mono',
    fontFamilyFallback: ['Menlo', 'Consolas', 'monospace'],
    fontSize: 13,
    fontWeight: FontWeight.w400,
    height: 1.5,
    letterSpacing: 0,
  );
}
