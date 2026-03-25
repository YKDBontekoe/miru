/**
 * Haptics utility — wraps expo-haptics with graceful fallback.
 * If expo-haptics isn't installed or the device doesn't support haptics,
 * all calls are silently no-ops.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let H: any = null;
try {
  // Dynamic require so a missing package never crashes the app
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  H = require('expo-haptics');
} catch {}

const safe = (fn: () => Promise<void> | undefined) => {
  try {
    fn()?.catch(() => {});
  } catch {}
};

export const haptic = {
  /** Subtle tap — use on list item press */
  light: () => safe(() => H?.impactAsync?.(H.ImpactFeedbackStyle?.Light)),
  /** Medium tap — use on primary actions */
  medium: () => safe(() => H?.impactAsync?.(H.ImpactFeedbackStyle?.Medium)),
  /** Heavy tap — use on long-press reveal */
  heavy: () => safe(() => H?.impactAsync?.(H.ImpactFeedbackStyle?.Heavy)),
  /** Success pattern — use on create/save */
  success: () => safe(() => H?.notificationAsync?.(H.NotificationFeedbackType?.Success)),
  /** Error pattern — use on delete/fail */
  error: () => safe(() => H?.notificationAsync?.(H.NotificationFeedbackType?.Error)),
  /** Subtle tick — use on toggle/pin */
  selection: () => safe(() => H?.selectionAsync?.()),
};
