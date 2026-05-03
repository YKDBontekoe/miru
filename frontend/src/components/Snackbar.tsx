import React, { useEffect, useRef } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';

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
      className="absolute bottom-8 left-4 right-4 bg-surfaceHigh rounded-2xl px-4 py-3 flex-row items-center z-[999] shadow-xl shadow-black/20"
      style={animStyle}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <AppText className="flex-1 text-text text-sm tracking-wide">
        {message}
      </AppText>
      {onAction && (
        <ScalePressable onPress={handleAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}>
          <AppText className="text-primary text-sm font-bold ms-4">
            {actionLabel}
          </AppText>
        </ScalePressable>
      )}
    </Animated.View>
  );
}
