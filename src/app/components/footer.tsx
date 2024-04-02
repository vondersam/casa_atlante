import Link from 'next/link';

function Footer() {
  return (
    <footer className="footer mt-5 py-3">
      <div className="row d-flex text-center">
        <div>
          <Link className="m-2" href="/legal">
            Legal notice
          </Link>
          <Link className="m-2" href="/privacy">
            Privacy policy
          </Link>
          <Link className="m-2" href="/cookies">
            Cookies policy
          </Link>
        </div>
      </div>

      <div className="row justify-content-center text-muted">
        Copyright © 2024 Casa Atlante. All Rights Reserved.
      </div>
    </footer>
  );
}

export default Footer;
