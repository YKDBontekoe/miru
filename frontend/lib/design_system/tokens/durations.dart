import 'package:flutter/material.dart';

/// Miru Design System -- Animation Durations & Curves
///
/// Consistent motion tokens for all transitions and animations.
/// Never use arbitrary Duration values outside this file.

abstract final class AppDurations {
  // ---------------------------------------------------------------------------
  // Durations
  // ---------------------------------------------------------------------------

  /// Instant feedback -- micro-interactions, color changes.
  static const Duration instant = Duration(milliseconds: 100);

  /// Fast -- button presses, opacity toggles, icon swaps.
  static const Duration fast = Duration(milliseconds: 150);

  /// Medium -- expanding panels, list scrolling hints, page elements.
  static const Duration medium = Duration(milliseconds: 250);

  /// Slow -- page transitions, complex layout shifts.
  static const Duration slow = Duration(milliseconds: 350);

  /// Extra slow -- onboarding animations, hero transitions.
  static const Duration slower = Duration(milliseconds: 500);

  /// Typing indicator bounce cycle.
  static const Duration typingBounce = Duration(milliseconds: 600);

  /// Stagger delay between typing indicator dots.
  static const Duration typingStagger = Duration(milliseconds: 180);

  // ---------------------------------------------------------------------------
  // Curves
  // ---------------------------------------------------------------------------

  /// Default easing for most transitions.
  static const Curve defaultCurve = Curves.easeOutCubic;

  /// Entrance animation easing (elements appearing).
  static const Curve enterCurve = Curves.easeOut;

  /// Exit animation easing (elements disappearing).
  static const Curve exitCurve = Curves.easeIn;

  /// Bounce-like easing for playful micro-interactions.
  static const Curve bounceCurve = Curves.easeInOut;

  /// Spring-like overshoot for attention-grabbing animations.
  static const Curve springCurve = Curves.elasticOut;
}
