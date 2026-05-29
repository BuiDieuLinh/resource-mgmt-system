import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import en from './locales/en';
import vi from './locales/vi';

export type Language = 'en' | 'vi';

const resources = { en, vi };
const language_key = process.env.EXPO_PUBLIC_LANGUAGE_STORAGE_KEY;

type TranslationKey = string;

interface I18nContextValue {
  language: Language;
  locale: string;
  setLanguage: (language: Language) => Promise<void>;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const getNestedValue = (source: unknown, key: string): string | undefined => {
  const value = key.split('.').reduce<unknown>((current, part) => {
    if (!current || typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[part];
  }, source);

  return typeof value === 'string' ? value : undefined;
};

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('vi');

  useEffect(() => {
    AsyncStorage.getItem(language_key).then((stored) => {
      if (stored === 'en' || stored === 'vi') {
        setLanguageState(stored);
      }
    });
  }, []);

  const setLanguage = async (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    await AsyncStorage.setItem(language_key, nextLanguage);
  };

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      locale: language === 'vi' ? 'vi-VN' : 'en-US',
      setLanguage,
      t: (key) =>
        getNestedValue(resources[language], key) ?? getNestedValue(resources.en, key) ?? key,
    }),
    [language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
