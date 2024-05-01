'use client';

import Link from 'next/link';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

function Header() {
  return (
    <>
      <Navbar expand="lg" className="bg-body mb-3">
        <Link href="/" passHref legacyBehavior>
          <Navbar.Brand>Casa Atlante</Navbar.Brand>
        </Link>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Link href="/house" passHref legacyBehavior>
              <Nav.Link>The house</Nav.Link>
            </Link>
            <Link href="/location" passHref legacyBehavior>
              <Nav.Link>Location</Nav.Link>
            </Link>
            <Link href="/gallery" passHref legacyBehavior>
              <Nav.Link>Gallery</Nav.Link>
            </Link>
            <Link href="/booking" passHref legacyBehavior>
              <Nav.Link>Booking</Nav.Link>
            </Link>
            <Link href="/about" passHref legacyBehavior>
              <Nav.Link>About</Nav.Link>
            </Link>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    </>
  );
}

export default Header;
