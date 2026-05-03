import React, { useEffect, useRef, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { AppText } from './AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { useTheme } from '@/hooks/useTheme';
import { theme } from '@/core/theme';

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
  const { C } = useTheme();
  const translateY = useSharedValue(80);
  const opacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          position: 'absolute',
          bottom: theme.spacing.xxl,
          left: theme.spacing.lg,
          right: theme.spacing.lg,
          backgroundColor: C.surfaceHigh,
          borderRadius: theme.borderRadius.lg,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          zIndex: 999,
          ...theme.elevation.xl,
        },
        message: {
          flex: 1,
          color: C.text,
          ...theme.typography.bodySm,
          letterSpacing: 0.1,
        },
        actionText: {
          color: C.primary,
          ...theme.typography.bodySm,
          fontWeight: '700',
          marginStart: theme.spacing.lg,
        },
      }),
    [C]
  );

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
      style={[styles.container, animStyle]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <AppText style={styles.message}>
        {message}
      </AppText>
      {onAction && (
        <ScalePressable onPress={handleAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}>
          <AppText style={styles.actionText}>
            {actionLabel}
          </AppText>
        </ScalePressable>
      )}
    </Animated.View>
  );
}
