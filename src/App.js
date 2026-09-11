import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import "./assets/fonts/fonts.css";

import Home from "./components/Home/Home";
import MyHeader from "./components/Header/MyHeader";
import Footer from "./components/Footer/Footer";
import Cart from "./components/Cart/Cart";
import { CartContext, CartProvider } from "./context/CartContext";
import { useContext, useEffect, useState } from "react";
import StickyPayButton from "./components/StickyPayButton/StickyPayButton";
import Checkout from "./components/Checkout/Checkout";
import { AuthProvider, RequireAuth } from "./context/AuthContext";
import {
  ForgotPasswordPage,
  LoginPage,
  RegisterPage,
  ResetPasswordPage,
} from "./components/Auth/AuthPages";
import Account from "./pages/Account/Account";
import OrderDetails from "./pages/OrderDetails/OrderDetails";
import PolicyPage, { POLICY_LINKS } from "./pages/Policy/PolicyPage";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";

function HomeWrapper() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const showThankYou = params.get("thankyou");
  const [visible, setVisible] = useState(!!showThankYou);
  const scrollTarget = params.get("scroll");

  useEffect(() => {
    if (showThankYou) {
      setVisible(true);
      const timer = setTimeout(() => { setVisible(false);}, 5000); // hide after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [showThankYou]);

   useEffect(() => {
    if (scrollTarget) {
      setTimeout(() => {
        document.getElementById(scrollTarget)?.scrollIntoView({ behavior: "smooth" });
      }, 300); // wait a bit for page render
    }
  }, [scrollTarget]);

  return (
    <>
      {visible && (
        <div className="thank-you-popup">
          🎉 Thank you for your order!
        </div>
      )}
      <Home />
    </>
  );
}

function CheckoutRoute() {
  const { availableCart } = useContext(CartContext);
  const navigate = useNavigate();
  return <Checkout cartData={availableCart} onClose={() => navigate("/cart")} />;
}

function App() {
  return (
    <CartProvider>
      <AuthProvider>
        <BrowserRouter>
          <MyHeader />

          {/* Header, footer and the sticky bar live outside the boundary, so a
              render error in one page cannot blank the whole app. */}
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<HomeWrapper />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route
                path="/checkout"
                element={
                  <RequireAuth>
                    <CheckoutRoute />
                  </RequireAuth>
                }
              />
              <Route
                path="/account"
                element={
                  <RequireAuth>
                    <Account />
                  </RequireAuth>
                }
              />
              <Route
                path="/account/orders/:orderId"
                element={
                  <RequireAuth>
                    <OrderDetails />
                  </RequireAuth>
                }
              />

              {/* The four legal pages, driven off the same list the footer links
                  from, so a route and its Strapi slug cannot drift apart. Public
                  and unauthenticated: policy text is readable by anyone. These are
                  deliberately NOT in the header — they belong in the footer. */}
              {POLICY_LINKS.map(({ slug, path }) => (
                <Route key={slug} path={path} element={<PolicyPage slug={slug} />} />
              ))}
            </Routes>
          </ErrorBoundary>

          <Footer />
          <StickyPayButton />
        </BrowserRouter>
      </AuthProvider>
    </CartProvider>
  );
}

export default App;
