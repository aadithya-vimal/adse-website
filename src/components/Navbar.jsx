import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/">
          <img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/c6cfcd55332049a9408582f69ed157d9eecf76f0?width=304"
            alt="CHRIST University Logo"
            className="navbar-logo"
          />
        </Link>
        <div className="navbar-center">
          <div className="navbar-links">
            <nav className="nav-menu">
              <Link to="/">Home</Link>
              <Link to="/about">About Us</Link>
              <Link to="/contact">Contact Us</Link>
              <Link to="/newsletter">Newsletter</Link>
              <Link to="/service-learning">Service Learning</Link>
            </nav>
          </div>
        </div>
      </div>
      <div
        className="hamburger"
        onClick={() => setMenuOpen(o => !o)}
      >
        <span></span><span></span><span></span>
      </div>
      <div className={`mobile-menu${menuOpen ? ' active' : ''}`}>
        <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
        <Link to="/about" onClick={() => setMenuOpen(false)}>About Us</Link>
        <Link to="/contact" onClick={() => setMenuOpen(false)}>Contact Us</Link>
        <Link to="/newsletter" onClick={() => setMenuOpen(false)}>Newsletter</Link>
        <Link to="/service-learning" onClick={() => setMenuOpen(false)}>Service Learning</Link>
      </div>
    </header>
  )
}
