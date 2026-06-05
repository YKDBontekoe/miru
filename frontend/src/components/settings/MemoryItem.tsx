import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../AppText';
import { Memory } from '../../core/models';
import { ScalePressable } from '../ScalePressable';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const C = {
  surface: DESIGN_TOKENS.colors.surface,
  border: DESIGN_TOKENS.colors.border,
  text: DESIGN_TOKENS.colors.text,
  muted: DESIGN_TOKENS.colors.muted,
  faint: DESIGN_TOKENS.colors.faint,
  primary: DESIGN_TOKENS.colors.primary,
};

export const MemoryItem = React.memo(function MemoryItem({
  memory,
  onDelete,
}: {
  memory: Memory;
  onDelete: () => void;
}) {
  const { i18n } = useTranslation();
  const date = React.useMemo(() => {
    return new Intl.DateTimeFormat(i18n.language, {
      month: 'short',
      day: 'numeric',
    }).format(new Date(memory.created_at));
  }, [i18n.language, memory.created_at]);

  return (
    <View
      style={{
        backgroundColor: C.surface,
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: C.border,
        flexDirection: 'row',
        alignItems: 'flex-start',
      }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: C.primary,
          marginTop: 6,
          marginEnd: 12,
        }}
      />
      <View style={{ flex: 1 }}>
        <AppText style={{ lineHeight: 20, fontSize: 14, color: C.text }}>{memory.content}</AppText>
        <AppText variant="caption" style={{ color: C.muted, marginTop: 4, fontSize: 11 }}>
          {date}
        </AppText>
      </View>
      <ScalePressable
        onPress={onDelete}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{ marginStart: 8 }}
      >
        <Ionicons name="close" size={16} color={C.faint} />
      </ScalePressable>
    </View>
  );
});
MemoryItem.displayName = 'MemoryItem';
