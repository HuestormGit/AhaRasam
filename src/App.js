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
import NotFound from "./pages/NotFound/NotFound";
import { useDocumentMeta } from "./hooks/usePolicy";

function PageTitle({ title, children }) {
  useDocumentMeta(`${title}${title === "AHA! Rasam" ? "" : " | AHA! Rasam"}`);
  return children;
}

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
              <Route path="/" element={<PageTitle title="AHA! Rasam"><HomeWrapper /></PageTitle>} />
              <Route path="/cart" element={<PageTitle title="Cart"><Cart /></PageTitle>} />
              <Route path="/login" element={<PageTitle title="Login"><LoginPage /></PageTitle>} />
              <Route path="/register" element={<PageTitle title="Register"><RegisterPage /></PageTitle>} />
              <Route path="/forgot-password" element={<PageTitle title="Forgot Password"><ForgotPasswordPage /></PageTitle>} />
              <Route path="/reset-password" element={<PageTitle title="Reset Password"><ResetPasswordPage /></PageTitle>} />
              <Route
                path="/checkout"
                element={
                  <PageTitle title="Checkout">
                    <RequireAuth>
                      <CheckoutRoute />
                    </RequireAuth>
                  </PageTitle>
                }
              />
              <Route
                path="/account"
                element={
                  <PageTitle title="Account">
                    <RequireAuth>
                      <Account />
                    </RequireAuth>
                  </PageTitle>
                }
              />
              <Route
                path="/account/orders/:orderId"
                element={
                  <PageTitle title="Order Details">
                    <RequireAuth>
                      <OrderDetails />
                    </RequireAuth>
                  </PageTitle>
                }
              />

              {/* The four legal pages, driven off the same list the footer links
                  from, so a route and its Strapi slug cannot drift apart. Public
                  and unauthenticated: policy text is readable by anyone. These are
                  deliberately NOT in the header — they belong in the footer. */}
              {POLICY_LINKS.map(({ slug, path }) => (
                <Route key={slug} path={path} element={<PolicyPage slug={slug} />} />
              ))}

              {/* Last, so every real route above still wins. This is normal
                  routing, not error handling — the boundary above stays for
                  actual render crashes. */}
              <Route path="*" element={<PageTitle title="Page Not Found"><NotFound /></PageTitle>} />
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
