'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useLocale, useT } from '@/i18n/context';
import { localizePath, toCanonicalPath } from '@/i18n/path';
import type { AppLocale } from '@/i18n/routing';

const navPaths = ['/house', '/location', '/gallery', '/booking', '/about'] as const;

function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useT('nav');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const canonicalPath = useMemo(() => toCanonicalPath(pathname || '/'), [pathname]);

  return (
    <header className="site-header">
      <div className="content-width header-inner">
        <Link className="brand" href={localizePath('/', locale)}>
          Casa Atlante
        </Link>

        <button
          className={`nav-toggle ${isOpen ? 'open' : ''}`}
          aria-expanded={isOpen}
          aria-label={t('toggle')}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span />
          <span />
        </button>

        <nav className={`main-nav ${isOpen ? 'open' : ''}`}>
          {navPaths.map((href) => (
            <Link
              key={href}
              href={localizePath(href, locale)}
              className={`nav-link ${canonicalPath === href ? 'active' : ''}`.trim()}
            >
              {t(href.slice(1))}
            </Link>
          ))}
          <label className="language-selector">
            <select
              value={locale}
              aria-label={t('languageLabel')}
              onChange={(event) => {
                const nextLocale = event.target.value as AppLocale;
                router.push(localizePath(canonicalPath, nextLocale));
              }}
            >
              <option value="en">{t('languageEnglish')}</option>
              <option value="es">{t('languageSpanish')}</option>
            </select>
          </label>
        </nav>
      </div>
    </header>
  );
}

export default Header;
