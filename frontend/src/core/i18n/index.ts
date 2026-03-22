import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { I18nManager } from 'react-native';

import en from './en.json';
import he from './he.json';

const resources = {
  en: { translation: en },
  he: { translation: he },
};

const locales = getLocales();
const languageTag = locales && locales.length > 0 ? locales[0].languageTag : 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: languageTag,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // react already safes from xss
  },
});

const isRTL = i18n.dir() === 'rtl';
I18nManager.allowRTL(isRTL);
I18nManager.forceRTL(isRTL);

export default i18n;
