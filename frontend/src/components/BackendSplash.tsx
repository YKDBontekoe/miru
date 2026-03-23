import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';

const MESSAGES = [
  'Waking up the AI...',
  'Brewing digital coffee...',
  'Connecting to the mainframe...',
  'Aligning neural weights...',
  'Almost ready...',
];

export function BackendSplash() {
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

  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeIn.duration(500)}
        exiting={FadeOut.duration(300)}
        style={styles.content}
      >
        <View style={styles.iconContainer}>
          <Animated.View style={[styles.ring, ringStyle]} />
          <Animated.View style={iconStyle}>
            <Ionicons name="sparkles" size={64} color="#2563EB" />
          </Animated.View>
        </View>

        <View style={styles.textContainer}>
          <AppText variant="h2" style={styles.title}>
            Miru
          </AppText>
          <View style={styles.messageContainer}>
            <ActivityIndicator size="small" color="#2563EB" style={styles.loader} />
            <Animated.View
              key={messageIndex}
              entering={FadeIn.duration(400)}
              exiting={FadeOut.duration(400)}
            >
              <AppText color="muted" style={styles.message}>
                {MESSAGES[messageIndex]}
              </AppText>
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#2563EB30',
  },
  textContainer: {
    alignItems: 'center',
    height: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E1E28',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    marginRight: 8,
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
  },
});
