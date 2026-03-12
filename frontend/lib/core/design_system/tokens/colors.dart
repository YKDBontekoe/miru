import 'package:flutter/material.dart';

/// Miru Design System -- Color Palette
///
/// A strict, semantic color system built on a modern blue foundation.
/// All colors are intentionally curated -- never use raw Color literals
/// outside this file.
abstract final class AppColors {
  // ---------------------------------------------------------------------------
  // Brand
  // ---------------------------------------------------------------------------

  /// Primary brand blue -- used for key actions, active states, and accents.
  static const Color primary = Color(0xFF2563EB);

  /// Lighter tint for hover/focus states and subtle highlights.
  static const Color primaryLight = Color(0xFF60A5FA);

  /// Darker shade for pressed states and text on light backgrounds.
  static const Color primaryDark = Color(0xFF1E40AF);

  /// Faintest brand wash -- used for tinted backgrounds, selection states.
  static const Color primarySurface = Color(0xFF1E293B);

  /// Light brand wash for light mode.
  static const Color primarySurfaceLight = Color(0xFFEFF6FF);

  // ---------------------------------------------------------------------------
  // Neutral -- Dark theme palette (primary surface system)
  // ---------------------------------------------------------------------------

  /// Deepest background -- app scaffold.
  static const Color backgroundDark = Color(0xFF0F0F14);

  /// Elevated surface -- cards, sheets, dialogs.
  static const Color surfaceDark = Color(0xFF1A1A22);

  /// Higher elevation surface -- app bars, input fields.
  static const Color surfaceHighDark = Color(0xFF242430);

  /// Highest elevation surface -- tooltips, menus.
  static const Color surfaceHighestDark = Color(0xFF2E2E3C);

  /// Subtle border / divider on dark surfaces.
  static const Color borderDark = Color(0xFF3A3A4A);

  /// Primary text on dark backgrounds.
  static const Color onSurfaceDark = Color(0xFFF0EFF4);

  /// Secondary / muted text on dark backgrounds.
  static const Color onSurfaceMutedDark = Color(0xFFA0A0B0);

  /// Disabled text on dark backgrounds.
  static const Color onSurfaceDisabledDark = Color(0xFF606070);

  // ---------------------------------------------------------------------------
  // Neutral -- Light theme palette
  // ---------------------------------------------------------------------------

  /// Lightest background -- app scaffold.
  static const Color backgroundLight = Color(0xFFF8F8FC);

  /// Elevated surface -- cards, sheets, dialogs.
  static const Color surfaceLight = Color(0xFFFFFFFF);

  /// Higher elevation surface -- app bars, input fields.
  static const Color surfaceHighLight = Color(0xFFF0F0F6);

  /// Highest elevation surface -- tooltips, menus.
  static const Color surfaceHighestLight = Color(0xFFE8E8F0);

  /// Subtle border / divider on light surfaces.
  static const Color borderLight = Color(0xFFD8D8E4);

  /// Primary text on light backgrounds.
  static const Color onSurfaceLight = Color(0xFF12121A);

  /// Secondary / muted text on light backgrounds.
  static const Color onSurfaceMutedLight = Color(0xFF6E6E80);

  /// Disabled text on light backgrounds.
  static const Color onSurfaceDisabledLight = Color(0xFFB0B0C0);

  // ---------------------------------------------------------------------------
  // Semantic / Status
  // ---------------------------------------------------------------------------

  /// Success -- confirmations, online indicators, positive trends.
  static const Color success = Color(0xFF34D399);

  /// Success background tint (dark mode).
  static const Color successSurfaceDark = Color(0xFF0D2E1F);

  /// Success background tint (light mode).
  static const Color successSurfaceLight = Color(0xFFF0FDF4);

  /// Warning -- caution states, degraded status.
  static const Color warning = Color(0xFFFBBF24);

  /// Warning background tint (dark mode).
  static const Color warningSurfaceDark = Color(0xFF2E2610);

  /// Warning background tint (light mode).
  static const Color warningSurfaceLight = Color(0xFFFFFBEB);

  /// Error -- destructive actions, failures, offline.
  static const Color error = Color(0xFFF87171);

  /// Error background tint (dark mode).
  static const Color errorSurfaceDark = Color(0xFF2E1212);

  /// Error background tint (light mode).
  static const Color errorSurfaceLight = Color(0xFFFEF2F2);

  /// Informational -- tips, neutral alerts.
  static const Color info = Color(0xFF60A5FA);

  /// Info background tint (dark mode).
  static const Color infoSurfaceDark = Color(0xFF121E2E);

  /// Info background tint (light mode).
  static const Color infoSurfaceLight = Color(0xFFEFF6FF);

  // ---------------------------------------------------------------------------
  // On-color (text/icons on filled backgrounds)
  // ---------------------------------------------------------------------------

  /// Text/icon on primary-colored backgrounds.
  static const Color onPrimary = Color(0xFFFFFFFF);

  /// Text/icon on success-colored backgrounds.
  static const Color onSuccess = Color(0xFF052E16);

  /// Text/icon on warning-colored backgrounds.
  static const Color onWarning = Color(0xFF422006);

  /// Text/icon on error-colored backgrounds.
  static const Color onError = Color(0xFF450A0A);

  /// Text/icon on info-colored backgrounds.
  static const Color onInfo = Color(0xFF0C1929);

  // ---------------------------------------------------------------------------
  // Chat-specific
  // ---------------------------------------------------------------------------

  /// User message bubble background (dark mode).
  static const Color userBubbleDark = primary;

  /// Assistant message bubble background (dark mode).
  static const Color assistantBubbleDark = surfaceHighDark;

  /// User message bubble background (light mode).
  static const Color userBubbleLight = primary;

  /// Assistant message bubble background (light mode).
  static const Color assistantBubbleLight = surfaceHighLight;

  // ---------------------------------------------------------------------------
  // Misc
  // ---------------------------------------------------------------------------

  /// Transparent.
  static const Color transparent = Color(0x00000000);

  /// Overlay scrim for modals/dialogs.
  static const Color scrim = Color(0x80000000);
}
