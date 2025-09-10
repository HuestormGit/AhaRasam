import { useEffect, useState, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/rasamlogo.png";
import { CartContext } from "../../context/CartContext";
import "./MyHeader.scss";

const MyHeader = () => {
  const [scrollnav, setScrollnav] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { cart } = useContext(CartContext);

  const location = useLocation();
  const navigate = useNavigate();

  const handleScroll = () => {
    if (window.scrollY > 120) {
      setScrollnav(true);
    } else {
      setScrollnav(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Navigate to home and scroll to section
  const goToSection = (id) => {
    if (location.pathname !== "/") {
      navigate(`/?scroll=${id}`); // go to home with query param
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
    setMenuOpen(false); // close mobile menu
  };

  return (
    <>
      <nav
        className={`navbar navbar-expand-lg my-navbar ${
          scrollnav ? "sticky-nav" : ""
        }`}
      >
        <div className="container-fluid">
          {/* Left menu (desktop only) */}
          <ul className="navbar-nav d-none d-lg-flex">
            <li className="nav-item">
              <button className="nav-link btn-link" onClick={() => goToSection("VideoSection")}>
                About us
              </button>
            </li>
            <li className="nav-item">
              <button className="nav-link btn-link" onClick={() => goToSection("product")}>
                Buy
              </button>
            </li>
          </ul>

          {/* Logo */}
          <a className="navbar-brand mx-auto" href="/">
            <img src={logo} alt="Logo" />
          </a>

          {/* Right menu (desktop only) */}
          <ul className="navbar-nav d-none d-lg-flex">
            <li className="nav-item">
              <Link to="/cart" className="nav-link">
                Cart ({cart.length})
              </Link>
            </li>
            <li className="nav-item">
              <button className="nav-link btn-link" onClick={() => goToSection("Contact")}>
                Contact
              </button>
            </li>
          </ul>

          {/* Mobile toggle */}
          <button
            className="navbar-toggler d-lg-none"
            type="button"
            onClick={() => setMenuOpen(true)}
          >
            <span className="navbar-toggler-icon"></span>
          </button>
        </div>
      </nav>

      {/* Mobile Fullscreen Overlay */}
      {menuOpen && (
        <div className="mobile-menu-overlay">
          <button className="close-btn" onClick={() => setMenuOpen(false)}>
            ✕
          </button>
          <ul>
            <li><button onClick={() => goToSection("VideoSection")}>About us</button></li>
            <li><button onClick={() => goToSection("product")}>Buy</button></li>
            <li><Link to="/cart" onClick={() => setMenuOpen(false)}>Cart ({cart.length})</Link></li>
            <li><button onClick={() => goToSection("Contact")}>Contact</button></li>
          </ul>
        </div>
      )}
    </>
  );
};

export default MyHeader;
