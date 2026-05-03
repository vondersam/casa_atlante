import { defaultLocale, type AppLocale } from './routing';

export function localizePath(pathname: string, locale: AppLocale) {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (locale === defaultLocale) {
    return path === '/es' ? '/' : path.replace(/^\/es(?=\/|$)/, '') || '/';
  }

  if (path === '/') return '/es';
  if (path.startsWith('/es/')) return path;
  return `/es${path}`;
}

export function toCanonicalPath(pathname: string) {
  return pathname.replace(/^\/es(?=\/|$)/, '') || '/';
}
