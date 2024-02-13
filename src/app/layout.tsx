import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import 'bootstrap/dist/css/bootstrap.css';
import Container from 'react-bootstrap/Container';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Casa Atlante',
  description:
    'Beautiful ocean view holiday rental home, situated on the sunny west of the island of La Palma, in the Jedey neighbourhood.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Container className="mt-4">{children}</Container>
      </body>
    </html>
  );
}
