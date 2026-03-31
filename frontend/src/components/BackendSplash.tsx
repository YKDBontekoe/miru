import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
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
    <View className="flex-1 bg-white items-center justify-center">
      <Animated.View className="items-center justify-center">
        <View className="w-40 h-40 items-center justify-center mb-10">
          <Animated.View
            className="absolute w-32 h-32 rounded-full bg-blue-50 border-2 border-blue-600/30"
            style={ringStyle}
          />
          <Animated.View style={iconStyle}>
            <Ionicons name="sparkles" size={64} color="#2563EB" />
          </Animated.View>
        </View>

        <View className="items-center h-25">
          <AppText
            variant="h2"
            className="text-3xl font-extrabold text-[#1E1E28] mb-4 tracking-tight"
          >
            Miru
          </AppText>
          <View className="flex-row items-center justify-center">
            <ActivityIndicator size="small" color="#2563EB" className="mr-2" />
            <Animated.View key={messageIndex}>
              <AppText color="muted" className="text-base font-medium">
                {MESSAGES[messageIndex]}
              </AppText>
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
