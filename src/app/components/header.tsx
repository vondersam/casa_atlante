"use client";

import Link from "next/link";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";

function Header() {
  return (
    <>
      <Navbar expand="lg" className="bg-body mb-3">
        <Navbar.Brand as={Link} href="/">
          Casa Atlante
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} href="/house">
              The house
            </Nav.Link>
            <Nav.Link as={Link} href="/location">
              Location
            </Nav.Link>
            <Nav.Link as={Link} href="/gallery">
              Gallery
            </Nav.Link>
            <Nav.Link as={Link} href="/booking">
              Booking
            </Nav.Link>
            <Nav.Link as={Link} href="/about">
              About
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    </>
  );
}

export default Header;
