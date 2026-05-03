import { defaultLocale, type AppLocale } from '@/i18n/routing';
import { getMessages } from '@/i18n/request';

export async function getServerT(locale: string, namespace: string) {
  const safeLocale: AppLocale = locale === 'es' ? 'es' : defaultLocale;
  const messages = await getMessages(safeLocale);
  const source = messages?.[namespace as keyof typeof messages] as Record<string, string> | undefined;
  return (key: string, values?: Record<string, string | number>) => {
    let text = source?.[key] ?? key;
    if (values) {
      for (const [token, value] of Object.entries(values)) {
        text = text.replaceAll(`{${token}}`, String(value));
      }
    }
    return text;
  };
}
