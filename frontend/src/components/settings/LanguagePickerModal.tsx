import React from 'react';
import { View, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../AppText';
import { ScalePressable } from '../ScalePressable';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const C = {
  surface: DESIGN_TOKENS.colors.surface,
  surfaceHigh: DESIGN_TOKENS.colors.surfaceSoft,
  border: DESIGN_TOKENS.colors.border,
  text: DESIGN_TOKENS.colors.text,
  faint: DESIGN_TOKENS.colors.faint,
  primary: DESIGN_TOKENS.colors.primary,
  primarySurface: DESIGN_TOKENS.colors.primarySoft,
};

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'nl', label: 'Dutch', nativeLabel: 'Nederlands' },
];

export function LanguagePickerModal({
  visible,
  currentLang,
  onSelect,
  onClose,
}: {
  visible: boolean;
  currentLang: string;
  onSelect: (code: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View
          style={{
            backgroundColor: C.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 24,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <AppText variant="h2" style={{ color: C.text }}>
              {t('settings.items.language')}
            </AppText>
            <ScalePressable onPress={onClose}>
              <Ionicons name="close-circle" size={26} color={C.faint} />
            </ScalePressable>
          </View>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = currentLang.startsWith(lang.code);
            return (
              <ScalePressable
                key={lang.code}
                onPress={() => onSelect(lang.code)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isSelected ? C.primarySurface : C.surfaceHigh,
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: isSelected ? C.primary : 'transparent',
                }}
              >
                <View style={{ flex: 1 }}>
                  <AppText style={{ fontSize: 16, fontWeight: '600', color: C.text }}>
                    {lang.nativeLabel}
                  </AppText>
                  <AppText style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>
                    {lang.label}
                  </AppText>
                </View>
                {isSelected && <Ionicons name="checkmark-circle" size={24} color={C.primary} />}
              </ScalePressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}
