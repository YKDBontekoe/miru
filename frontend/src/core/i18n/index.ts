import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import nl from './nl.json';

const resources = {
  en: { translation: en },
  nl: { translation: nl },
};

// Detect device language without requiring the expo-localization native module.
// Uses the standard Intl API (available on all JS engines) with a safe fallback.
function getDeviceLanguage(): string {
  try {
    const locale =
      // React Native exposes this on the global object
      (typeof navigator !== 'undefined' && navigator.language) ||
      new Intl.DateTimeFormat().resolvedOptions().locale ||
      'en';
    return locale.split('-')[0]; // e.g. "nl-NL" → "nl"
  } catch {
    return 'en';
  }
}

const deviceLang = getDeviceLanguage();

i18n.use(initReactI18next).init({
  resources,
  lng: deviceLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
