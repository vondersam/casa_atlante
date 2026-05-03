import { defaultLocale, type AppLocale, isValidLocale } from './routing';

export async function getMessages(locale: string) {
  const safeLocale: AppLocale = isValidLocale(locale) ? locale : defaultLocale;
  return (await import(`../../messages/${safeLocale}.json`)).default;
}
