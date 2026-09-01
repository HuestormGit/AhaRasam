import "./MyHeader.scss";
import logo from "../../assets/Aha-Rasam-logo.png";
import { useEffect, useState, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CartContext } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

const MyHeader = () => {
  const [scrollnav, setScrollnav] = useState(false);
  const { cart } = useContext(CartContext);
  const { user } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

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
      navigate(`/?scroll=${id}`);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      className={`navbar navbar-expand-md my-navbar ${
        scrollnav ? "sticky-nav" : ""
      }`}
    >
      <div className="container-fluid p-0">
        <Link className="navbar-brand mobile-brand d-md-none" to="/">
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

        <div className="collapse navbar-collapse" id="navbarNav">
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
                <Link to="/cart" className="nav-link btn-link">
                  Cart ({cart.length})
                </Link>
              </li>
              <li className="nav-item">
                {user ? (
                  <Link to="/account" className="nav-link btn-link">
                    Account
                  </Link>
                ) : (
                  <Link to="/login" className="nav-link btn-link">
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
