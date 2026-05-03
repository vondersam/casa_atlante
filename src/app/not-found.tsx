'use client';

import Link from 'next/link';
import { useLocale, useT } from '@/i18n/context';
import { localizePath } from '@/i18n/path';

export default function NotFound() {
  const t = useT('errors');
  const locale = useLocale();

  return (
    <section className="section">
      <div className="content-width legal-text">
        <h1>{t('notFoundTitle')}</h1>
        <p>{t('notFoundMessage')}</p>
        <Link href={localizePath('/', locale)}>{t('returnHome')}</Link>
      </div>
    </section>
  );
}
