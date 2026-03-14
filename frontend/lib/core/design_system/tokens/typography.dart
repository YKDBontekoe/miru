import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Miru Design System -- Typography Scale
///
/// A strict typographic hierarchy using Inter via Google Fonts.
/// All text in the app must use one of these styles. Never create ad-hoc
/// TextStyle instances outside this file.
///
/// The scale follows a minor-third progression (1.2x) for font sizes,
/// paired with intentional weight and height values.
abstract final class AppTypography {
  // ---------------------------------------------------------------------------
  // Font family
  // ---------------------------------------------------------------------------

  /// Primary font family (Inter via Google Fonts).
  static const String fontFamily = 'Inter';

  // ---------------------------------------------------------------------------
  // Display -- Hero headers, splash screens
  // ---------------------------------------------------------------------------

  static TextStyle get displayLarge => GoogleFonts.inter(
    fontSize: 40,
    fontWeight: FontWeight.w800,
    height: 1.15,
    letterSpacing: -1.5,
  );

  static TextStyle get displayMedium => GoogleFonts.inter(
    fontSize: 32,
    fontWeight: FontWeight.w700,
    height: 1.2,
    letterSpacing: -0.8,
  );

  static TextStyle get displaySmall => GoogleFonts.inter(
    fontSize: 28,
    fontWeight: FontWeight.w700,
    height: 1.25,
    letterSpacing: -0.4,
  );

  // ---------------------------------------------------------------------------
  // Heading -- Section headers, page titles
  // ---------------------------------------------------------------------------

  static TextStyle get headingLarge => GoogleFonts.inter(
    fontSize: 24,
    fontWeight: FontWeight.w700,
    height: 1.3,
    letterSpacing: -0.3,
  );

  static TextStyle get headingMedium => GoogleFonts.inter(
    fontSize: 20,
    fontWeight: FontWeight.w600,
    height: 1.3,
    letterSpacing: -0.2,
  );

  static TextStyle get headingSmall => GoogleFonts.inter(
    fontSize: 18,
    fontWeight: FontWeight.w600,
    height: 1.35,
    letterSpacing: -0.1,
  );

  // ---------------------------------------------------------------------------
  // Body -- Primary content text
  // ---------------------------------------------------------------------------

  static TextStyle get bodyLarge => GoogleFonts.inter(
    fontSize: 16,
    fontWeight: FontWeight.w400,
    height: 1.55,
    letterSpacing: 0,
  );

  static TextStyle get bodyMedium => GoogleFonts.inter(
    fontSize: 15,
    fontWeight: FontWeight.w400,
    height: 1.5,
    letterSpacing: 0,
  );

  static TextStyle get bodySmall => GoogleFonts.inter(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 1.45,
    letterSpacing: 0.1,
  );

  // ---------------------------------------------------------------------------
  // Label -- Buttons, chips, badges, form labels
  // ---------------------------------------------------------------------------

  static TextStyle get labelLarge => GoogleFonts.inter(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    height: 1.3,
    letterSpacing: 0.1,
  );

  static TextStyle get labelMedium => GoogleFonts.inter(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    height: 1.3,
    letterSpacing: 0.15,
  );

  static TextStyle get labelSmall => GoogleFonts.inter(
    fontSize: 12,
    fontWeight: FontWeight.w600,
    height: 1.3,
    letterSpacing: 0.2,
  );

  // ---------------------------------------------------------------------------
  // Caption -- Helper text, timestamps, metadata
  // ---------------------------------------------------------------------------

  static TextStyle get caption => GoogleFonts.inter(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    height: 1.35,
    letterSpacing: 0.2,
  );

  static TextStyle get captionSmall => GoogleFonts.inter(
    fontSize: 11,
    fontWeight: FontWeight.w400,
    height: 1.3,
    letterSpacing: 0.25,
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
