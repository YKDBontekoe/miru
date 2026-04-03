import React, { useMemo, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
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
  const [visible, setVisible] = useState(false);

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
        style={{
          position: 'absolute',
          right: 24,
          bottom: 118,
        }}
      >
        <ScalePressable
          onPress={() => setVisible(true)}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: DESIGN_TOKENS.colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: DESIGN_TOKENS.colors.surface,
            ...DESIGN_TOKENS.shadow,
          }}
        >
          <Ionicons name="add" size={30} color={DESIGN_TOKENS.colors.white} />
        </ScalePressable>
      </View>

      <Modal visible={visible} animationType="fade" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.25)' }}>
          <Pressable onPress={() => setVisible(false)} style={{ flex: 1 }} />
          <View
            style={{
              backgroundColor: DESIGN_TOKENS.colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderWidth: 1,
              borderColor: DESIGN_TOKENS.colors.border,
              paddingHorizontal: 16,
              paddingTop: 14,
              paddingBottom: 26,
            }}
          >
            <AppText variant="h3" style={{ color: DESIGN_TOKENS.colors.text, marginBottom: 10 }}>
              {t('quickActions.title')}
            </AppText>
            {actions.map((action) => (
              <ScalePressable
                key={action.key}
                onPress={() => {
                  setVisible(false);
                  router.push(action.route as never);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: DESIGN_TOKENS.colors.border,
                  backgroundColor: DESIGN_TOKENS.colors.surfaceSoft,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                    backgroundColor: DESIGN_TOKENS.colors.primarySoft,
                  }}
                >
                  <Ionicons name={action.icon} size={17} color={DESIGN_TOKENS.colors.primary} />
                </View>
                <AppText style={{ color: DESIGN_TOKENS.colors.text, fontWeight: '700' }}>
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
