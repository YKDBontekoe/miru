/**
 * Haptics utility — wraps expo-haptics with graceful fallback.
 * If expo-haptics isn't installed or the device doesn't support haptics,
 * all calls are silently no-ops.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let H: any = null;
let initialized = false;

function ensureInit() {
  if (initialized) return;
  try {
    // Dynamic import to prevent 'require() style import is forbidden'
    import('expo-haptics')
      .then((m) => {
        H = m;
      })
      .catch(() => {
        // Ignore
      });
  } catch {}
  initialized = true;
}

const safe = (fn: () => Promise<void> | undefined) => {
  ensureInit();
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
