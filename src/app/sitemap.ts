import type { MetadataRoute } from 'next';

const base = 'https://www.casa-atlante.com';
const paths = ['/', '/house', '/location', '/gallery', '/booking', '/about', '/legal', '/privacy', '/cookies'];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.flatMap((path) => [
    { url: `${base}${path}`, alternates: { languages: { en: `${base}${path}`, es: `${base}/es${path === '/' ? '' : path}` } } },
    { url: `${base}/es${path === '/' ? '' : path}`, alternates: { languages: { en: `${base}${path}`, es: `${base}/es${path === '/' ? '' : path}` } } }
  ]);
}
