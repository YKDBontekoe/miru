import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { Memory } from '@/core/models';
import { ScalePressable } from '@/components/ScalePressable';
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
    if (!memory.created_at || isNaN(new Date(memory.created_at).getTime())) {
      return '';
    }
    return new Intl.DateTimeFormat(i18n.language, {
      month: 'short',
      day: 'numeric',
    }).format(new Date(memory.created_at));
  }, [i18n.language, memory.created_at]);

  return (
    <View className="bg-surface rounded-xl p-3.5 mb-2 border border-border flex-row items-start">
      <View className="w-2 h-2 rounded-full bg-primary mt-1.5 mr-3" />
      <View className="flex-1">
        <AppText className="leading-5 text-sm text-text">{memory.content}</AppText>
        <AppText variant="caption" className="text-muted mt-1 text-[11px]">
          {date}
        </AppText>
      </View>
      <ScalePressable
        onPress={onDelete}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className="ml-2"
      >
        <Ionicons name="close" size={16} color={C.faint} />
      </ScalePressable>
    </View>
  );
});
MemoryItem.displayName = 'MemoryItem';
