import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { theme } from '@/core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const MESSAGES = [
  'Waking up the AI...',
  'Brewing digital coffee...',
  'Connecting to the mainframe...',
  'Aligning neural weights...',
  'Almost ready...',
];

/**
 * A full-screen splash component shown while the application connects
 * to the backend or completes initial loading tasks.
 *
 * Features pulsing animations and cycling loading messages.
 */
export const BackendSplash = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  // Rotate messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Pulsing background
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [scale, opacity]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Floating icon
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(10, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [translateY]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const primaryColor = theme.colors.primary.DEFAULT;

  return (
    <View style={styles.container}>
      <Animated.View style={styles.contentContainer}>
        <View style={styles.iconWrapper}>
          <Animated.View style={[styles.pulsingRing, ringStyle]} />
          <Animated.View style={iconStyle}>
            <Ionicons name="sparkles" size={64} color={primaryColor} />
          </Animated.View>
        </View>

        <View style={styles.textContainer}>
          <AppText variant="h2" style={styles.title}>
            Miru
          </AppText>
          <View style={styles.loadingRow}>
            <ActivityIndicator
              size="small"
              color={primaryColor}
              style={styles.loader}
            />
            <Animated.View key={messageIndex}>
              <AppText color="muted" style={styles.messageText}>
                {MESSAGES[messageIndex]}
              </AppText>
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_TOKENS.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.huge,
  },
  pulsingRing: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary.surfaceLight,
    borderWidth: 2,
    borderColor: `${theme.colors.primary.DEFAULT}4D`, // primary with 30% alpha (hex 4D)
  },
  textContainer: {
    alignItems: 'center',
    height: 100,
  },
  title: {
    color: theme.colors.surface.dark,
    marginBottom: theme.spacing.lg,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    marginRight: theme.spacing.sm,
  },
  messageText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '500',
  },
});
