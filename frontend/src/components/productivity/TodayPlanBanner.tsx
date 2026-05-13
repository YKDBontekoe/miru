import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { theme } from '@/core/theme';
import { useTheme } from '@/hooks/useTheme';

interface TodayPlanBannerProps {
  todayPlan: string | null;
  onDismiss: () => void;
}

export const TodayPlanBanner = React.memo(function TodayPlanBanner({
  todayPlan,
  onDismiss,
}: TodayPlanBannerProps) {
  const { C } = useTheme();

  if (!todayPlan) return null;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: C.primarySurface, borderColor: C.border },
      ]}
    >
      <View style={styles.header}>
        <AppText style={[styles.title, { color: C.text }]}>Today plan</AppText>
        <Pressable onPress={onDismiss}>
          <Ionicons name="close" size={16} color={C.subtext} />
        </Pressable>
      </View>
      <AppText style={[styles.content, { color: C.subtext }]}>{todayPlan}</AppText>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    fontSize: 15,
  },
  content: {
    marginTop: 8,
    lineHeight: 20,
  },
});
