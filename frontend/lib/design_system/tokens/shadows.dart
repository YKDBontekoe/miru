import 'package:flutter/material.dart';

/// Miru Design System -- Elevation Shadows
///
/// Layered shadow system for establishing visual hierarchy.
/// These are designed for dark surfaces; light-mode shadows use
/// slightly higher opacity.
abstract final class AppShadows {
  // ---------------------------------------------------------------------------
  // Dark theme shadows
  // ---------------------------------------------------------------------------

  /// No shadow.
  static const List<BoxShadow> none = [];

  /// Subtle lift -- cards at rest.
  static const List<BoxShadow> sm = [
    BoxShadow(color: Color(0x1A000000), blurRadius: 4, offset: Offset(0, 1)),
  ];

  /// Medium elevation -- hovered cards, input focus.
  static const List<BoxShadow> md = [
    BoxShadow(color: Color(0x26000000), blurRadius: 8, offset: Offset(0, 2)),
    BoxShadow(color: Color(0x0D000000), blurRadius: 2, offset: Offset(0, 1)),
  ];

  /// High elevation -- dropdowns, popovers.
  static const List<BoxShadow> lg = [
    BoxShadow(color: Color(0x33000000), blurRadius: 16, offset: Offset(0, 4)),
    BoxShadow(color: Color(0x1A000000), blurRadius: 6, offset: Offset(0, 2)),
  ];

  /// Maximum elevation -- modals, dialogs.
  static const List<BoxShadow> xl = [
    BoxShadow(color: Color(0x40000000), blurRadius: 24, offset: Offset(0, 8)),
    BoxShadow(color: Color(0x26000000), blurRadius: 10, offset: Offset(0, 4)),
  ];

  /// Colored glow -- primary action buttons, focus rings.
  static List<BoxShadow> primaryGlow = [
    BoxShadow(
      color: const Color(0xFF7C6FFF).withAlpha(60),
      blurRadius: 16,
      offset: const Offset(0, 4),
    ),
  ];
}
