import "./MyHeader.scss";
import logo from "../../assets/Aha-Rasam-logo.png";
import { useEffect, useRef, useState, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CartContext } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

const MyHeader = () => {
  const [scrollnav, setScrollnav] = useState(false);
  const { itemCount } = useContext(CartContext);
  const { user } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();
  const collapseRef = useRef(null);

  // Bootstrap (loaded from the CDN in index.html) owns this collapse, so we ask
  // *it* to close rather than toggling classes ourselves — that keeps the `show`
  // class, the instance state and the toggler's aria-expanded in step.
  // `toggle: false` matters: Collapse's constructor toggles by default, which
  // would open a menu that had never been opened.
  const closeMenu = (afterClose) => {
    const menu = collapseRef.current;
    if (!menu?.classList.contains("show") || !window.bootstrap?.Collapse) {
      afterClose?.();
      return;
    }
    // The navbar is in normal flow, so the page shifts up as the menu collapses.
    // Scrolling has to wait for that, or it lands past the target section.
    if (afterClose) {
      menu.addEventListener("hidden.bs.collapse", afterClose, { once: true });
    }
    window.bootstrap.Collapse.getOrCreateInstance(menu, { toggle: false }).hide();
  };

  const handleScroll = () => {
    const offset = window.scrollY;
    if (offset > 120) {
      setScrollnav(true);
    } else {
      setScrollnav(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth scroll logic
  const goToSection = (id) => {
    if (location.pathname !== "/") {
      closeMenu();
      navigate(`/?scroll=${id}`);
    } else {
      closeMenu(() =>
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
      );
    }
  };

  return (
    <nav
      className={`navbar navbar-expand-md my-navbar ${
        scrollnav ? "sticky-nav" : ""
      }`}
    >
      <div className="container-fluid p-0">
        <Link
          className="navbar-brand mobile-brand d-md-none"
          to="/"
          onClick={() => closeMenu()}
        >
          <img src={logo} alt="Logo" />
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav" ref={collapseRef}>
          <div className="navbar-layout">
            <ul className="navbar-nav navbar-side navbar-left">
              <li className="nav-item">
                <button className="nav-link btn-link" onClick={() => goToSection("AboutUs")}>
                  About us
                </button>
              </li>
              <li className="nav-item">
                <button className="nav-link btn-link" onClick={() => goToSection("product")}>
                  Buy
                </button>
              </li>
            </ul>

            <Link className="navbar-brand desktop-brand d-none d-md-flex" to="/">
              <img src={logo} alt="Logo" />
            </Link>

            <ul className="navbar-nav navbar-side navbar-right">
              <li className="nav-item">
                <button className="nav-link btn-link" onClick={() => goToSection("Contact")}>
                  Contact
                </button>
              </li>
              <li className="nav-item">
                <Link to="/cart" className="nav-link btn-link" onClick={() => closeMenu()}>
                  Cart ({itemCount})
                </Link>
              </li>
              <li className="nav-item">
                {user ? (
                  <Link to="/account" className="nav-link btn-link" onClick={() => closeMenu()}>
                    Account
                  </Link>
                ) : (
                  <Link to="/login" className="nav-link btn-link" onClick={() => closeMenu()}>
                    Login
                  </Link>
                )}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default MyHeader;
