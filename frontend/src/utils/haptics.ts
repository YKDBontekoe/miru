import { Platform } from 'react-native';

let Haptics: any = null;
try {
  // Use dynamic import instead of require
  import('expo-haptics')
    .then((m) => {
      Haptics = m;
    })
    .catch(() => {
      // Ignore error if module is missing
    });
} catch {
  // Ignore
}

export const triggerLightHaptic = async () => {
  if (Platform.OS === 'web' || !Haptics) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Ignore
  }
};

export const triggerMediumHaptic = async () => {
  if (Platform.OS === 'web' || !Haptics) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Ignore
  }
};
