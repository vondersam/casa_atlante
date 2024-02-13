'use client';

import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

function Header() {
  return (
    <>
      <Navbar>
        <Navbar.Brand href="#home">Casa Atlante</Navbar.Brand>
        <Nav className="me-auto">
          <Nav.Link href="/stay/the_home">Your stay</Nav.Link>
          <Nav.Link href="/location">Location</Nav.Link>
          <Nav.Link href="/about">About</Nav.Link>
        </Nav>
      </Navbar>
    </>
  );
}

export default Header;
