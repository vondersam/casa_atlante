'use client';

import Link from 'next/link';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

function Header() {
  return (
    <>
      <Navbar expand="lg" className="bg-body mb-3">
        <Link className="brand" href="/">
          Casa Atlante
        </Link>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Link href="/house">The house</Link>
            <Link href="/location">Location</Link>
            <Link href="/gallery">Gallery</Link>
            <Link href="/booking">Booking</Link>
            <Link href="/about">About</Link>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    </>
  );
}

export default Header;
