import React from 'react';
import { View, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { SUPPORTED_LANGUAGES } from '@/core/i18n/constants';

const C = {
  surface: DESIGN_TOKENS.colors.surface,
  surfaceHigh: DESIGN_TOKENS.colors.surfaceSoft,
  border: DESIGN_TOKENS.colors.border,
  text: DESIGN_TOKENS.colors.text,
  faint: DESIGN_TOKENS.colors.faint,
  primary: DESIGN_TOKENS.colors.primary,
  primarySurface: DESIGN_TOKENS.colors.primarySoft,
};

export const LanguagePickerModal = ({
  visible,
  currentLang,
  onSelect,
  onClose,
}: {
  visible: boolean;
  currentLang: string;
  onSelect: (code: string) => void;
  onClose: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-surface rounded-t-[28px] p-6">
          <View className="flex-row justify-between items-center mb-5">
            <AppText variant="h2" className="text-text">
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
                className={`flex-row items-center rounded-[14px] p-4 mb-2 border ${
                  isSelected ? 'bg-primarySoft border-primary' : 'bg-surfaceSoft border-transparent'
                }`}
              >
                <View className="flex-1">
                  <AppText className="text-base font-semibold text-text">
                    {lang.nativeLabel}
                  </AppText>
                  <AppText className="text-[13px] text-faint mt-0.5">{lang.label}</AppText>
                </View>
                {isSelected && <Ionicons name="checkmark-circle" size={24} color={C.primary} />}
              </ScalePressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
};
