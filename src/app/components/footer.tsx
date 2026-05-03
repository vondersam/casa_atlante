'use client';

import Link from 'next/link';
import { useLocale, useT } from '@/i18n/context';
import { localizePath } from '@/i18n/path';

function Footer() {
  const locale = useLocale();
  const t = useT('footer');

  return (
    <footer className="site-footer">
      <div className="content-width footer-grid">
        <div className="footer-block">
          <p className="footer-title">Casa Atlante</p>
          <p className="footer-text">Jedey, La Palma, Canary Islands</p>
          <p className="footer-text">
            <a href="mailto:booking@casa-atlante.com">booking@casa-atlante.com</a>
          </p>
          <p className="footer-text">{t('license')}</p>
        </div>

        <div className="footer-block">
          <p className="footer-heading">{t('navigate')}</p>
          <Link href={localizePath('/house', locale)}>{t('house')}</Link>
          <Link href={localizePath('/location', locale)}>{t('location')}</Link>
          <Link href={localizePath('/gallery', locale)}>{t('gallery')}</Link>
          <Link href={localizePath('/booking', locale)}>{t('booking')}</Link>
          <Link href={localizePath('/about', locale)}>{t('about')}</Link>
        </div>

        <div className="footer-block">
          <p className="footer-heading">{t('legalTitle')}</p>
          <Link href={localizePath('/legal', locale)}>{t('legal')}</Link>
          <Link href={localizePath('/privacy', locale)}>{t('privacy')}</Link>
          <Link href={localizePath('/cookies', locale)}>{t('cookies')}</Link>
        </div>
      </div>

      <div className="content-width footer-bottom">
        <span>© {new Date().getFullYear()} Casa Atlante. {t('rights')}</span>
      </div>
    </footer>
  );
}

export default Footer;
