import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import 'bootstrap/dist/css/bootstrap.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './global.css';
import Container from 'react-bootstrap/Container';
import Header from './components/header';
import Footer from './components/footer';

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
        <div className="d-flex flex-column h-100">
          <Container>
            <Header />
            <main>{children}</main>
          </Container>
          <Footer />
        </div>
      </body>
    </html>
  );
}
