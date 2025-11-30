import Link from 'next/link';

function Footer() {
  return (
    <footer className="site-footer">
      <div className="content-width footer-grid">
        <div className="footer-block">
          <p className="footer-title">Casa Atlante</p>
          <p className="footer-text">Jedey, La Palma, Canary Islands</p>
          <p className="footer-text">
            <a href="mailto:booking@casa-atlante.com">booking@casa-atlante.com</a>
          </p>
          <p className="footer-text">Tourist Licence: VV-38-5-0001908</p>
        </div>

        <div className="footer-block">
          <p className="footer-heading">Navigate</p>
          <Link href="/house">The house</Link>
          <Link href="/location">Location</Link>
          <Link href="/gallery">Gallery</Link>
          <Link href="/booking">Booking</Link>
          <Link href="/about">About</Link>
        </div>

        <div className="footer-block">
          <p className="footer-heading">Legal</p>
          <Link href="/legal">Legal notice</Link>
          <Link href="/privacy">Privacy policy</Link>
          <Link href="/cookies">Cookies policy</Link>
        </div>
      </div>

      <div className="content-width footer-bottom">
        <span>© {new Date().getFullYear()} Casa Atlante. All rights reserved.</span>
      </div>
    </footer>
  );
}

export default Footer;
