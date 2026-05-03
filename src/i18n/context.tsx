'use client';

import { createContext, useContext } from 'react';
import { defaultLocale, type AppLocale } from './routing';

type Messages = Record<string, unknown>;

type I18nContextValue = {
  locale: AppLocale;
  messages: Messages;
};

const I18nContext = createContext<I18nContextValue>({
  locale: defaultLocale,
  messages: {}
});

export function I18nProvider({
  children,
  locale,
  messages
}: {
  children: React.ReactNode;
  locale: AppLocale;
  messages: Messages;
}) {
  return <I18nContext.Provider value={{ locale, messages }}>{children}</I18nContext.Provider>;
}

export function useLocale() {
  return useContext(I18nContext).locale;
}

export function useT(namespace: string) {
  const { messages } = useContext(I18nContext);
  return (key: string, values?: Record<string, string | number>) => {
    const source = messages?.[namespace as keyof typeof messages] as Record<string, string> | undefined;
    let text = source?.[key] ?? key;
    if (values) {
      for (const [token, value] of Object.entries(values)) {
        text = text.replaceAll(`{${token}}`, String(value));
      }
    }
    return text;
  };
}
