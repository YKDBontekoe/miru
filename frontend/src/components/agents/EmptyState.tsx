import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppText } from '../AppText';
import { ScalePressable } from '../ScalePressable';
import { useTheme } from '../../hooks/useTheme';

interface EmptyStateProps {
  searchQuery: string;
  onCreate: () => void;
  onBrowse: () => void;
}

export function EmptyState({ searchQuery, onCreate, onBrowse }: EmptyStateProps) {
  const { C } = useTheme();

  if (searchQuery.trim()) {
    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        style={{ alignItems: 'center', paddingVertical: 56 }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: C.surfaceHigh,
            borderWidth: 1,
            borderColor: C.border,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
          }}
        >
          <Ionicons name="search" size={26} color={C.faint} />
        </View>
        <AppText style={{ color: C.text, fontWeight: '600', fontSize: 16, marginBottom: 6 }}>
          No matches
        </AppText>
        <AppText style={{ color: C.muted, textAlign: 'center', fontSize: 14 }}>
          Try a different search term.
        </AppText>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={{ alignItems: 'center', paddingVertical: 56, paddingHorizontal: 24 }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: `${C.primary}12`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          borderWidth: 1,
          borderColor: `${C.primary}20`,
        }}
      >
        <Ionicons name="people" size={36} color={`${C.primary}90`} />
      </View>
      <AppText style={{ color: C.text, fontWeight: '700', fontSize: 18, marginBottom: 8 }}>
        No personas yet
      </AppText>
      <AppText
        style={{
          color: C.muted,
          textAlign: 'center',
          fontSize: 14,
          lineHeight: 21,
          marginBottom: 28,
        }}
      >
        Create your first AI persona or start from a template.
      </AppText>
      <ScalePressable onPress={onCreate}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: C.primary,
            borderRadius: 16,
            paddingVertical: 14,
            paddingHorizontal: 28,
            marginBottom: 12,
            shadowColor: C.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Ionicons name="sparkles" size={17} color="white" style={{ marginEnd: 8 }} />
          <AppText style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>
            Create Persona
          </AppText>
        </View>
      </ScalePressable>
      <TouchableOpacity
        onPress={onBrowse}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
      >
        <Ionicons name="albums-outline" size={15} color={C.muted} />
        <AppText style={{ color: C.muted, fontSize: 14 }}>Browse templates</AppText>
      </TouchableOpacity>
    </Animated.View>
  );
}
