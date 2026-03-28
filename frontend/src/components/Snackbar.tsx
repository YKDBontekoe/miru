import React, { useEffect, useRef } from 'react';
import { TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { AppText } from './AppText';

interface SnackbarProps {
  visible: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  duration?: number;
}

export function Snackbar({
  visible,
  message,
  actionLabel = 'Undo',
  onAction,
  onDismiss,
  duration = 4500,
}: SnackbarProps) {
  const translateY = useSharedValue(80);
  const opacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = () => {
    translateY.value = withSpring(80, { damping: 18, stiffness: 220 });
    opacity.value = withTiming(0, { duration: 180 }, (done) => {
      if (done && onDismiss) runOnJS(onDismiss)();
    });
  };

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
      opacity.value = withTiming(1, { duration: 200 });

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(dismiss, duration);
    } else {
      dismiss();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleAction = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    translateY.value = withSpring(80, { damping: 18, stiffness: 220 });
    opacity.value = withTiming(0, { duration: 180 }, (done) => {
      if (done) {
        if (onDismiss) runOnJS(onDismiss)();
        if (onAction) runOnJS(onAction)();
      }
    });
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: 24,
          start: 16,
          end: 16,
          backgroundColor: '#1A1A2E',
          borderRadius: 16,
          paddingHorizontal: 18,
          paddingVertical: 14,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.22,
          shadowRadius: 14,
          elevation: 10,
          zIndex: 999,
        },
        animStyle,
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <AppText style={{ flex: 1, color: '#E0E0F0', fontSize: 14, lineHeight: 20 }}>
        {message}
      </AppText>
      {onAction && (
        <TouchableOpacity onPress={handleAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}>
          <AppText style={{ color: '#60A5FA', fontWeight: '700', fontSize: 14, marginStart: 16 }}>
            {actionLabel}
          </AppText>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}
