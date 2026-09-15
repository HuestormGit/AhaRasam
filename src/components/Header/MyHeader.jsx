import "./MyHeader.scss";
import logo from "../../assets/Aha-Rasam-logo.png";
import { useEffect, useRef, useState, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CartContext } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useAccountNotifications } from "../../context/AccountNotificationsContext";
import { FaRegBell } from "react-icons/fa";
import {
  FiInfo,
  FiLogIn,
  FiMail,
  FiShoppingBag,
  FiShoppingCart,
  FiUser,
} from "react-icons/fi";

const MyHeader = () => {
  const [scrollnav, setScrollnav] = useState(false);
  const { itemCount } = useContext(CartContext);
  const { user } = useAuth();
  // True when anything in the Account section is unseen. Today that is only
  // the Orders tab; the header reads the flag, never the source.
  const { hasUnseen } = useAccountNotifications();

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

  // Login page shows the AuthShell logo instead of the full navbar.
  if (location.pathname === "/login") return null;

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
                  <FiInfo className="nav-ico" aria-hidden="true" />
                  About us
                </button>
              </li>
              <li className="nav-item">
                <button className="nav-link btn-link" onClick={() => goToSection("product")}>
                  <FiShoppingBag className="nav-ico" aria-hidden="true" />
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
                  <FiMail className="nav-ico" aria-hidden="true" />
                  Contact
                </button>
              </li>
              <li className="nav-item">
                <Link to="/cart" className="nav-link btn-link" onClick={() => closeMenu()}>
                  <FiShoppingCart className="nav-ico" aria-hidden="true" />
                  Cart ({itemCount})
                </Link>
              </li>
              <li className="nav-item">
                {user ? (
                  <Link to="/account" className="nav-link btn-link" onClick={() => closeMenu()}>
                    <FiUser className="nav-ico" aria-hidden="true" />
                    Account
                    {hasUnseen && (
                      <>
                        <span className="nav-bell" aria-hidden="true">
                          <FaRegBell />
                        </span>
                        <span className="visually-hidden">
                          , new notifications
                        </span>
                      </>
                    )}
                  </Link>
                ) : (
                  <Link to="/login" className="nav-link btn-link" onClick={() => closeMenu()}>
                    <FiLogIn className="nav-ico" aria-hidden="true" />
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
