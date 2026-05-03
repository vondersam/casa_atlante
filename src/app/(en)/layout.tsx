import type { Metadata } from 'next';
import SiteShell from '@/app/components/site-shell';
import { getMessages } from '@/i18n/request';

export async function generateMetadata(): Promise<Metadata> {
  const messages = await getMessages('en');
  const meta = messages.metadata as Record<string, string>;

  return {
    title: meta.title,
    description: meta.description
  };
}

export default function EnglishLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <SiteShell locale="en">{children}</SiteShell>;
}
