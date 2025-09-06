import "./MyHeader.scss";
import logo from "../../assets/rasamlogo.png";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { CartContext } from "../../context/CartContext";


const MyHeader = () => {
  const [scrollnav, setScrollnav] = useState(false);

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
  }, []);

  const { cart } = useContext(CartContext);

  return (
    <nav
      className={`navbar navbar-expand-md my-navbar ${
        scrollnav ? "sticky-nav" : ""
      }`}
    >
      <div className="container-fluid p-0">
        <a className="navbar-brand d-md-none" href="/">
          <img src={logo} alt="" />
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
              <a className="nav-link active" aria-current="page" href="#VideoSection">
                About us
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#product">
                Buy
              </a>
            </li>
            <a className="navbar-brand d-none d-md-block" href="/">
              <img src={logo} alt="" />
            </a>
            <li className="nav-item">
              {/* <a className="nav-link" to="/cart">
                Cart({cartCount})
              </a> */}
              <Link to="/cart">Cart ({cart.length})</Link>
              {/* <Link to="/cart">Cart({cartCount})</Link> */}
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#Contact">
                Contact
              </a>
            </li>
            
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default MyHeader;
