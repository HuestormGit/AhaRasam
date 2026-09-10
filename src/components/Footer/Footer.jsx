import { Link } from "react-router-dom";
import { POLICY_LINKS } from "../../pages/Policy/PolicyPage";
import "./Footer.scss";

// The legal pages live here and only here. They are deliberately absent from the
// header, the desktop nav and the mobile menu: primary navigation is for
// shopping, and a policy is something you go looking for.
const Footer = () => {
    return (
    <footer>
        <nav className="footer-policies" aria-labelledby="footer-policies-title">
            <h2 id="footer-policies-title">Policies</h2>
            <ul>
                {POLICY_LINKS.map(({ slug, path, label }) => (
                    <li key={slug}>
                        <Link to={path}>{label}</Link>
                    </li>
                ))}
            </ul>
        </nav>
        <p>Copyright &copy; 2025 AHA! Rasam. All rights reserved.</p>
        <div className="footer"></div>
    </footer>
    );
};

export default Footer;
