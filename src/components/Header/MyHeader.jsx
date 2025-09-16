import "./MyHeader.scss";
import logo from "../../assets/rasamlogo.png";
import { useEffect, useState, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CartContext } from "../../context/CartContext";

const MyHeader = () => {
  const [scrollnav, setScrollnav] = useState(false);
  const { cart } = useContext(CartContext);

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
        <a className="navbar-brand d-md-none" href="/">
          <img src={logo} alt="Logo" />
        </a>

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
          <ul className="navbar-nav mx-auto">
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

            <li className="nav-item">
              <a className="navbar-brand d-none d-md-block" href="/">
                <img src={logo} alt="Logo" />
              </a>
            </li>
            
            <li className="nav-item">
              <Link to="/cart" className="nav-link btn-link">
                Cart ({cart.length})
              </Link>
            </li>
            <li className="nav-item">
              <button className="nav-link btn-link" onClick={() => goToSection("Contact")}>
                Contact
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default MyHeader;
