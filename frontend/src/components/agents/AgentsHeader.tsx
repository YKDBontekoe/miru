import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../AppText';
import { ScalePressable } from '../ScalePressable';
import { haptic } from '../../utils/haptics';
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
    <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <View>
          <AppText style={{ fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.5 }}>
            Personas
          </AppText>
          <AppText style={{ color: C.muted, fontSize: 13, marginTop: 1 }}>
            {agentsCount === 0
              ? 'Your AI companions'
              : `${agentsCount} persona${agentsCount !== 1 ? 's' : ''}`}
          </AppText>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {/* View toggle */}
          {agentsCount > 0 && (
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: C.surfaceHigh,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: C.border,
                overflow: 'hidden',
              }}
            >
              {(['list', 'grid'] as const).map((mode) => (
                <ScalePressable
                  key={mode}
                  onPress={() => {
                    haptic.selection();
                    onViewModeChange(mode);
                  }}
                  style={{
                    padding: 7,
                    backgroundColor: viewMode === mode ? C.primary : 'transparent',
                  }}
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
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: C.surfaceHigh,
                borderWidth: 1,
                borderColor: C.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
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
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: C.primary,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 10,
                shadowColor: C.primary,
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25,
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              <Ionicons name="add" size={18} color="white" style={{ marginEnd: 4 }} />
              <AppText style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>New</AppText>
            </View>
          </ScalePressable>
        </View>
      </View>
    </View>
  );
}
