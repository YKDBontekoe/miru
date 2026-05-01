import React, { useMemo, useState } from 'react';
import { Modal, Pressable, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { theme } from '@/core/theme';

type QuickAction = {
  key: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  route: string;
};

export function GlobalQuickActions() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const tabBarHeight = 64;
  const tabBarOffset = 16;
  const fabSpacing = 14;
  const fabBottom = insets.bottom + tabBarHeight + tabBarOffset + fabSpacing;

  const actions = useMemo<QuickAction[]>(
    () => [
      {
        key: 'chat',
        icon: 'chatbubble-ellipses',
        label: t('quickActions.newChat'),
        route: '/(main)/chat?openCreate=1',
      },
      {
        key: 'agent',
        icon: 'people',
        label: t('quickActions.newAgent'),
        route: '/(main)/agents?openCreate=1',
      },
      {
        key: 'task',
        icon: 'checkbox',
        label: t('quickActions.newTask'),
        route: '/(main)/productivity?openCreateTask=1',
      },
      {
        key: 'note',
        icon: 'document-text',
        label: t('quickActions.newNote'),
        route: '/(main)/productivity?openCreateNote=1',
      },
    ],
    [t]
  );

  if (pathname?.includes('/chat/')) {
    return null;
  }

  return (
    <>
      <View
        pointerEvents="box-none"
        style={[styles.fabContainer, { bottom: fabBottom }]}
      >
        <ScalePressable
          onPress={() => setVisible(true)}
          style={[
            styles.fabButton,
            {
              backgroundColor: DESIGN_TOKENS.colors.primary,
              borderColor: DESIGN_TOKENS.colors.surface,
              ...DESIGN_TOKENS.shadow,
            },
          ]}
        >
          <Ionicons name="add" size={30} color={DESIGN_TOKENS.colors.white} />
        </ScalePressable>
      </View>

      <Modal visible={visible} animationType="fade" transparent onRequestClose={() => setVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable onPress={() => setVisible(false)} style={styles.modalBackdrop} />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: DESIGN_TOKENS.colors.surface,
                borderColor: DESIGN_TOKENS.colors.border,
              },
            ]}
          >
            <AppText variant="h3" style={[styles.modalTitle, { color: DESIGN_TOKENS.colors.text }]}>
              {t('quickActions.title')}
            </AppText>
            {actions.map((action) => (
              <ScalePressable
                key={action.key}
                onPress={() => {
                  setVisible(false);
                  router.push(action.route as never);
                }}
                style={[
                  styles.actionItem,
                  {
                    borderColor: DESIGN_TOKENS.colors.border,
                    backgroundColor: DESIGN_TOKENS.colors.surfaceSoft,
                  },
                ]}
              >
                <View
                  style={[
                    styles.actionIconContainer,
                    { backgroundColor: DESIGN_TOKENS.colors.primarySoft },
                  ]}
                >
                  <Ionicons name={action.icon} size={17} color={DESIGN_TOKENS.colors.primary} />
                </View>
                <AppText style={[styles.actionLabel, { color: DESIGN_TOKENS.colors.text }]}>
                  {action.label}
                </AppText>
              </ScalePressable>
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: theme.spacing.xxl,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 14,
    paddingBottom: 26,
  },
  modalTitle: {
    marginBottom: theme.spacing.md,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  actionIconContainer: {
    width: 34,
    height: 34,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  actionLabel: {
    fontWeight: '700',
  },
});
