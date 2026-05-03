import { NextRequest, NextResponse } from 'next/server';
import { defaultLocale, isValidLocale } from './src/i18n/routing';

function withHeaders(req: NextRequest, locale: string, pathname: string) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-locale', locale);
  requestHeaders.set('x-pathname', pathname);
  return requestHeaders;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];

  if (first && isValidLocale(first)) {
    if (first === defaultLocale) {
      const target = '/' + segments.slice(1).join('/');
      return NextResponse.redirect(new URL(target || '/', req.url));
    }

    const unprefixed = '/' + segments.slice(1).join('/');
    const rewrittenUrl = req.nextUrl.clone();
    rewrittenUrl.pathname = unprefixed || '/';

    return NextResponse.rewrite(rewrittenUrl, {
      request: { headers: withHeaders(req, first, pathname) }
    });
  }

  return NextResponse.next({
    request: { headers: withHeaders(req, defaultLocale, pathname) }
  });
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)']
};
