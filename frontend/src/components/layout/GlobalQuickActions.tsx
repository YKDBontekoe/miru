import React, { useMemo, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { DESIGN_TOKENS } from '@/core/design/tokens';

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
        className="absolute right-6"
        style={{ bottom: fabBottom }}
      >
        <ScalePressable
          onPress={() => setVisible(true)}
          className="w-14 h-14 rounded-full items-center justify-center border shadow-md"
          style={{
            backgroundColor: DESIGN_TOKENS.colors.primary,
            borderColor: DESIGN_TOKENS.colors.surface,
          }}
        >
          <Ionicons name="add" size={30} color={DESIGN_TOKENS.colors.white} />
        </ScalePressable>
      </View>

      <Modal visible={visible} animationType="fade" transparent onRequestClose={() => setVisible(false)}>
        <View className="flex-1 justify-end bg-black/25">
          <Pressable onPress={() => setVisible(false)} className="flex-1" />
          <View
            className="rounded-t-3xl border px-4 pt-3.5 pb-6"
            style={{
              backgroundColor: DESIGN_TOKENS.colors.surface,
              borderColor: DESIGN_TOKENS.colors.border,
            }}
          >
            <AppText variant="h3" className="mb-2.5" style={{ color: DESIGN_TOKENS.colors.text }}>
              {t('quickActions.title')}
            </AppText>
            {actions.map((action) => (
              <ScalePressable
                key={action.key}
                onPress={() => {
                  setVisible(false);
                  router.push(action.route as never);
                }}
                className="flex-row items-center rounded-xl border px-3 py-3 mb-2"
                style={{
                  borderColor: DESIGN_TOKENS.colors.border,
                  backgroundColor: DESIGN_TOKENS.colors.surfaceSoft,
                }}
              >
                <View
                  className="w-[34px] h-[34px] rounded-[10px] items-center justify-center mr-2.5"
                  style={{ backgroundColor: DESIGN_TOKENS.colors.primarySoft }}
                >
                  <Ionicons name={action.icon} size={17} color={DESIGN_TOKENS.colors.primary} />
                </View>
                <AppText className="font-bold" style={{ color: DESIGN_TOKENS.colors.text }}>
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
