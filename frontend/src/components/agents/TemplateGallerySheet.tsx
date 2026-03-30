import React, { useEffect, useState, useMemo } from 'react';
import { View,Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInUp, SlideOutDown, FadeInDown } from 'react-native-reanimated';
import { AppText } from '../AppText';
import { SkeletonAgentCard } from '../SkeletonCard';
import { AgentAvatar } from '../AgentAvatar';
import { useTheme } from '../../hooks/useTheme';
import { useAgentStore, AgentTemplate } from '../../store/useAgentStore';
import { getAgentColor } from './agentUtils';
import { haptic } from '../../utils/haptics';
import { ScalePressable } from '@/components/ScalePressable';

interface TemplateGallerySheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (t: AgentTemplate) => void;
}

export function TemplateGallerySheet({ visible, onClose, onSelect }: TemplateGallerySheetProps) {
  const { C } = useTheme();
  const { templates, isLoadingTemplates, fetchTemplates } = useAgentStore();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (visible && templates.length === 0) {
      setHasError(false);
      fetchTemplates().catch(() => setHasError(true));
    }
  }, [visible, templates.length, fetchTemplates]);

  const skeletonData = useMemo(() => [0, 1, 2], []);

  const renderTemplateItem = React.useCallback(
    ({ item: template, index: i }: { item: AgentTemplate; index: number }) => {
      const color = getAgentColor(template.name);
      return (
        <Animated.View
          entering={FadeInDown.delay(i * 60)
            .springify()
            .damping(20)}
        >
          <ScalePressable
            onPress={() => {
              haptic.light();
              onSelect(template);
              onClose();
            }}
          >
            <View
              style={{
                backgroundColor: C.surfaceHigh,
                borderRadius: 16,
                padding: 16,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: C.border,
                borderLeftWidth: 3,
                borderLeftColor: color,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <AgentAvatar name={template.name} size={42} color={color} />
                <View style={{ flex: 1, marginStart: 12 }}>
                  <AppText style={{ fontSize: 15, fontWeight: '700', color: C.text }}>
                    {template.name}
                  </AppText>
                  <AppText style={{ fontSize: 12, color: C.muted }} numberOfLines={1}>
                    {template.description}
                  </AppText>
                </View>
                <View
                  style={{
                    backgroundColor: `${color}18`,
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                  }}
                >
                  <AppText style={{ color, fontSize: 11, fontWeight: '700' }}>Use</AppText>
                </View>
              </View>
              {template.goals.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                  {template.goals.slice(0, 3).map((g, gi) => (
                    <View
                      key={gi}
                      style={{
                        backgroundColor: `${color}12`,
                        borderRadius: 10,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                      }}
                    >
                      <AppText style={{ color, fontSize: 11 }}>{g}</AppText>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScalePressable>
        </Animated.View>
      );
    },
    [onSelect, onClose, C.surfaceHigh, C.border, C.text, C.muted]
  );

  const renderContent = () => {
    if (hasError) {
      return (
        <View style={{ alignItems: 'center', paddingVertical: 48 }}>
          <AppText style={{ fontSize: 40, marginBottom: 12 }}>⚠️</AppText>
          <AppText style={{ color: C.text, fontWeight: '600', fontSize: 16, marginBottom: 6 }}>
            Failed to load templates
          </AppText>
          <AppText style={{ color: C.muted, textAlign: 'center', fontSize: 14, marginBottom: 16 }}>
            Check your connection and try again.
          </AppText>
          <ScalePressable
            onPress={() => {
              setHasError(false);
              fetchTemplates().catch(() => setHasError(true));
            }}
            style={{
              backgroundColor: C.primary,
              borderRadius: 10,
              paddingHorizontal: 20,
              paddingVertical: 9,
            }}
          >
            <AppText style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>Retry</AppText>
          </ScalePressable>
        </View>
      );
    }

    if (isLoadingTemplates) {
      return (
        <FlatList
          data={skeletonData}
          keyExtractor={(item) => item.toString()}
          scrollEnabled={false}
          renderItem={({ item }) => <SkeletonAgentCard index={item} />}
        />
      );
    }

    if (templates.length === 0) {
      return (
        <View style={{ alignItems: 'center', paddingVertical: 48 }}>
          <AppText style={{ fontSize: 40, marginBottom: 12 }}>🏗️</AppText>
          <AppText style={{ color: C.text, fontWeight: '600', fontSize: 16, marginBottom: 6 }}>
            Templates coming soon
          </AppText>
          <AppText style={{ color: C.muted, textAlign: 'center', fontSize: 14 }}>
            Pre-built personas will be available here.
          </AppText>
        </View>
      );
    }

    return (
      <FlatList
        data={templates}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        renderItem={renderTemplateItem}
      />
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <Animated.View
          entering={SlideInUp.springify().damping(22)}
          exiting={SlideOutDown.duration(200)}
          style={{
            backgroundColor: C.surface,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            maxHeight: '80%',
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 12 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: C.faint }} />
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 22,
              paddingVertical: 16,
            }}
          >
            <View>
              <AppText style={{ fontSize: 20, fontWeight: '700', color: C.text }}>
                Templates
              </AppText>
              <AppText style={{ color: C.muted, fontSize: 13, marginTop: 1 }}>
                Start with a pre-built persona
              </AppText>
            </View>
            <ScalePressable
              onPress={onClose}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: C.surfaceHigh,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={16} color={C.muted} />
            </ScalePressable>
          </View>

          {renderContent()}
        </Animated.View>
      </View>
    </Modal>
  );
}
