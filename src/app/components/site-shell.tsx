import Header from './header';
import Footer from './footer';
import { I18nProvider } from '@/i18n/context';
import { getMessages } from '@/i18n/request';
import type { AppLocale } from '@/i18n/routing';

export default async function SiteShell({
  children,
  locale
}: {
  children: React.ReactNode;
  locale: AppLocale;
}) {
  const messages = await getMessages(locale);

  return (
    <I18nProvider locale={locale} messages={messages}>
      <div className="page-shell">
        <Header />
        <main>{children}</main>
        <Footer />
      </div>
    </I18nProvider>
  );
}
