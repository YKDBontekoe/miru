import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent } from '@/core/models';
import { HOME_COLORS } from '../homeTheme';

import { TFunction } from 'i18next';

export function HomeAgentBadge({
  agent,
  onPress,
  t,
}: {
  agent: Agent;
  onPress: () => void;
  t: TFunction;
}) {
  return (
    <ScalePressable
      onPress={onPress}
      style={{
        borderRadius: 18,
        borderWidth: 1,
        borderColor: HOME_COLORS.border,
        backgroundColor: HOME_COLORS.surface,
        padding: 10,
        width: '48.5%',
        marginBottom: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 10,
            backgroundColor: HOME_COLORS.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
          }}
        >
          <AppText variant="bodySm" style={{ color: HOME_COLORS.primary, fontWeight: '800' }}>
            {agent.name?.[0]?.toUpperCase() ?? '?'}
          </AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="bodySm" numberOfLines={1} style={{ color: HOME_COLORS.text, fontWeight: '700' }}>
            {agent.name}
          </AppText>
        </View>
      </View>
      <AppText variant="caption" style={{ color: HOME_COLORS.muted }}>
        {t('messages', { count: agent.message_count })}
      </AppText>
    </ScalePressable>
  );
}
