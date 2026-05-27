import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../AppText';
import { theme } from '../../core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const T = {
  surface: { light: DESIGN_TOKENS.colors.surface },
  onSurface: {
    light: DESIGN_TOKENS.colors.text,
    mutedLight: DESIGN_TOKENS.colors.muted,
  },
  primary: {
    DEFAULT: DESIGN_TOKENS.colors.primary,
    surfaceLight: DESIGN_TOKENS.colors.primarySoft,
  },
};
const S = theme.spacing;
const R = theme.borderRadius;

type ProductivityHeaderProps = {
  title: string;
  subtitle: string;
  onGeneratePlan: () => void;
  onAddNote: () => void;
  onAddTask: () => void;
  children?: ReactNode;
};

export function ProductivityHeader({
  title,
  subtitle,
  onGeneratePlan,
  onAddNote,
  onAddTask,
  children,
}: ProductivityHeaderProps) {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerRow}>
        <View>
          <AppText variant="h1" style={styles.headerTitle}>
            {title}
          </AppText>
          <AppText style={styles.headerSubtitle}>{subtitle}</AppText>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={onGeneratePlan}
            style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="sparkles" size={20} color={T.primary.DEFAULT} />
          </Pressable>
          <Pressable
            onPress={onAddNote}
            style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="document-text" size={20} color={T.primary.DEFAULT} />
          </Pressable>
          <Pressable
            onPress={onAddTask}
            style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="checkbox" size={20} color={T.primary.DEFAULT} />
          </Pressable>
        </View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: S.xl,
    paddingTop: S.md,
    paddingBottom: S.lg,
    backgroundColor: T.surface.light,
    ...theme.elevation.sm,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: S.lg,
  },
  headerTitle: {
    color: T.onSurface.light,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: T.onSurface.mutedLight,
    fontSize: 14,
    marginTop: S.xs,
  },
  headerActions: {
    flexDirection: 'row',
    gap: S.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: R.full,
    backgroundColor: T.primary.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
