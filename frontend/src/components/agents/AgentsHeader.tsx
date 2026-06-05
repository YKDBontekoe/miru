import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { haptic } from '@/utils/haptics';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const C = {
  text: DESIGN_TOKENS.colors.text,
  muted: DESIGN_TOKENS.colors.muted,
  surfaceHigh: DESIGN_TOKENS.colors.surfaceSoft,
  border: DESIGN_TOKENS.colors.border,
  primary: DESIGN_TOKENS.colors.primary,
};

interface AgentsHeaderProps {
  agentsCount: number;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
  onShowTemplates: () => void;
  onShowCreate: () => void;
}

export function AgentsHeader({
  agentsCount,
  viewMode,
  onViewModeChange,
  onShowTemplates,
  onShowCreate,
}: AgentsHeaderProps) {
  return (
    <View className="px-5 pt-2 pb-2.5">
      <View className="flex-row justify-between items-center mb-3">
        <View>
          <AppText className="text-[28px] font-extrabold text-text tracking-tight">
            Personas
          </AppText>
          <AppText className="text-muted text-[13px] mt-px">
            {agentsCount === 0
              ? 'Your AI companions'
              : `${agentsCount} persona${agentsCount !== 1 ? 's' : ''}`}
          </AppText>
        </View>

        <View className="flex-row gap-2 items-center">
          {/* View toggle */}
          {agentsCount > 0 && (
            <View className="flex-row bg-surfaceSoft rounded-xl border border-border overflow-hidden">
              {(['list', 'grid'] as const).map((mode) => (
                <ScalePressable
                  key={mode}
                  onPress={() => {
                    haptic.selection();
                    onViewModeChange(mode);
                  }}
                  className={`p-2 ${viewMode === mode ? 'bg-primary' : 'bg-transparent'}`}
                >
                  <Ionicons
                    name={mode === 'list' ? 'list' : 'grid'}
                    size={15}
                    color={viewMode === mode ? 'white' : C.muted}
                  />
                </ScalePressable>
              ))}
            </View>
          )}

          {/* Templates */}
          {agentsCount > 0 && (
            <ScalePressable
              onPress={() => {
                haptic.light();
                onShowTemplates();
              }}
              className="w-9 h-9 rounded-xl bg-surfaceSoft border border-border items-center justify-center"
            >
              <Ionicons name="albums-outline" size={17} color={C.muted} />
            </ScalePressable>
          )}

          {/* New button */}
          <ScalePressable
            onPress={() => {
              haptic.light();
              onShowCreate();
            }}
          >
            <View className="flex-row items-center bg-primary rounded-2xl px-4 py-2.5 shadow-sm shadow-primary/25 elevation-sm">
              <Ionicons name="add" size={18} color="white" className="mr-1" />
              <AppText className="text-white font-bold text-sm">New</AppText>
            </View>
          </ScalePressable>
        </View>
      </View>
    </View>
  );
}
