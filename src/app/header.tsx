'use client';

import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

function Header() {
  return (
    <>
      <Navbar>
        <Navbar.Brand href="/">Casa Atlante</Navbar.Brand>
        <Nav className="me-auto">
          <Nav.Link href="/house">The house</Nav.Link>
          <Nav.Link href="/location">Location</Nav.Link>
          <Nav.Link href="/booking">Booking</Nav.Link>
          <Nav.Link href="/about">About</Nav.Link>
        </Nav>
      </Navbar>
    </>
  );
}

export default Header;
