import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Playfair_Display, Source_Sans_3 } from 'next/font/google';
import './global.css';
import Header from './components/header';
import Footer from './components/footer';
import { I18nProvider } from '@/i18n/context';
import { getMessages } from '@/i18n/request';
import { defaultLocale, isValidLocale } from '@/i18n/routing';
import { toCanonicalPath } from '@/i18n/path';

const headingFont = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-heading'
});

const bodyFont = Source_Sans_3({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-body'
});

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const localeHeader = h.get('x-locale') ?? defaultLocale;
  const locale = isValidLocale(localeHeader) ? localeHeader : defaultLocale;
  const pathname = h.get('x-pathname') ?? '/';
  const canonicalPath = toCanonicalPath(pathname);
  const messages = await getMessages(locale);
  const meta = messages.metadata as Record<string, string>;

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `https://www.casa-atlante.com${canonicalPath}`,
      languages: {
        en: `https://www.casa-atlante.com${canonicalPath}`,
        es: `https://www.casa-atlante.com/es${canonicalPath === '/' ? '' : canonicalPath}`
      }
    }
  };
}

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const localeHeader = h.get('x-locale') ?? defaultLocale;
  const locale = isValidLocale(localeHeader) ? localeHeader : defaultLocale;
  const messages = await getMessages(locale);

  return (
    <html lang={locale}>
      <body className={`${bodyFont.variable} ${headingFont.variable}`}>
        <I18nProvider locale={locale} messages={messages}>
          <div className="page-shell">
            <Header />
            <main>{children}</main>
            <Footer />
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
