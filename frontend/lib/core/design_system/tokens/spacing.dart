import 'package:flutter/material.dart';

/// Miru Design System -- Spacing & Sizing Scale
///
/// A strict 4px-based spacing scale. All layout spacing, padding, and margins
/// must use these values. Never use arbitrary pixel values for spacing.
abstract final class AppSpacing {
  // ---------------------------------------------------------------------------
  // Spacing scale (multiples of 4)
  // ---------------------------------------------------------------------------

  /// 0px -- no spacing.
  static const double none = 0;

  /// 2px -- hairline spacing, tight icon gaps.
  static const double xxs = 2;

  /// 4px -- minimal spacing, tight element pairs.
  static const double xs = 4;

  /// 8px -- compact spacing, inline elements.
  static const double sm = 8;

  /// 12px -- standard inner padding.
  static const double md = 12;

  /// 16px -- standard section padding.
  static const double lg = 16;

  /// 20px -- generous padding.
  static const double xl = 20;

  /// 24px -- section separation.
  static const double xxl = 24;

  /// 32px -- large section gaps.
  static const double xxxl = 32;

  /// 40px -- hero-level spacing.
  static const double huge = 40;

  /// 48px -- page-level vertical rhythm.
  static const double massive = 48;

  /// 64px -- maximum spacing.
  static const double colossal = 64;

  // ---------------------------------------------------------------------------
  // Border radii
  // ---------------------------------------------------------------------------

  /// No rounding.
  static const double radiusNone = 0;

  /// 4px -- subtle rounding for small elements.
  static const double radiusXs = 4;

  /// 8px -- standard rounding for cards, inputs.
  static const double radiusSm = 8;

  /// 12px -- medium rounding for containers.
  static const double radiusMd = 12;

  /// 16px -- generous rounding for panels.
  static const double radiusLg = 16;

  /// 20px -- large rounding for chat bubbles.
  static const double radiusXl = 20;

  /// 24px -- pill rounding for buttons, chips.
  static const double radiusXxl = 24;

  /// 9999px -- full pill / circle.
  static const double radiusFull = 9999;

  // ---------------------------------------------------------------------------
  // Common EdgeInsets presets
  // ---------------------------------------------------------------------------

  static const EdgeInsets paddingNone = EdgeInsets.zero;

  static const EdgeInsets paddingAllXs = EdgeInsets.all(xs);
  static const EdgeInsets paddingAllSm = EdgeInsets.all(sm);
  static const EdgeInsets paddingAllMd = EdgeInsets.all(md);
  static const EdgeInsets paddingAllLg = EdgeInsets.all(lg);
  static const EdgeInsets paddingAllXl = EdgeInsets.all(xl);
  static const EdgeInsets paddingAllXxl = EdgeInsets.all(xxl);

  static const EdgeInsets paddingHorizontalSm = EdgeInsets.symmetric(
    horizontal: sm,
  );
  static const EdgeInsets paddingHorizontalMd = EdgeInsets.symmetric(
    horizontal: md,
  );
  static const EdgeInsets paddingHorizontalLg = EdgeInsets.symmetric(
    horizontal: lg,
  );
  static const EdgeInsets paddingHorizontalXl = EdgeInsets.symmetric(
    horizontal: xl,
  );

  static const EdgeInsets paddingVerticalSm = EdgeInsets.symmetric(
    vertical: sm,
  );
  static const EdgeInsets paddingVerticalMd = EdgeInsets.symmetric(
    vertical: md,
  );
  static const EdgeInsets paddingVerticalLg = EdgeInsets.symmetric(
    vertical: lg,
  );

  /// Standard page padding: 16px horizontal.
  static const EdgeInsets pagePadding = EdgeInsets.symmetric(horizontal: lg);

  /// Standard card padding: 16px all sides.
  static const EdgeInsets cardPadding = EdgeInsets.all(lg);

  /// Chat message list padding.
  static const EdgeInsets chatListPadding = EdgeInsets.symmetric(
    vertical: lg,
    horizontal: md,
  );

  /// Chat bubble inner padding.
  static const EdgeInsets bubblePadding = EdgeInsets.symmetric(
    horizontal: 14,
    vertical: 10,
  );

  /// Input bar padding.
  static const EdgeInsets inputBarPadding = EdgeInsets.symmetric(
    horizontal: md,
    vertical: sm,
  );

  // ---------------------------------------------------------------------------
  // Sizing constraints
  // ---------------------------------------------------------------------------

  /// Max bubble width as fraction of screen width.
  static const double bubbleMaxWidthFraction = 0.78;

  /// Status indicator dot size.
  static const double statusDotSize = 8;

  /// Typing indicator dot size.
  static const double typingDotSize = 6;

  /// Icon size -- small.
  static const double iconSm = 16;

  /// Icon size -- medium (default).
  static const double iconMd = 20;

  /// Icon size -- large.
  static const double iconLg = 24;

  /// Icon size -- extra large (hero / empty state).
  static const double iconXl = 48;

  /// Icon size -- colossal (splash / brand).
  static const double iconXxl = 64;

  /// Avatar size -- small.
  static const double avatarSm = 32;

  /// Avatar size -- medium.
  static const double avatarMd = 40;

  /// Avatar size -- large.
  static const double avatarLg = 56;

  /// Button height -- standard.
  static const double buttonHeight = 44;

  /// Button height -- compact.
  static const double buttonHeightSm = 36;

  /// Input field height.
  static const double inputHeight = 44;

  /// AppBar height.
  static const double appBarHeight = 56;
}
