import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationVI from './vi/translation.json';
import translationEN from './en/translation.json';

const resources = {
  vi: {
    translation: translationVI,
  },
  en: {
    translation: translationEN,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'vi', // Mặc định là Tiếng Việt
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
