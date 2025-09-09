import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import "./App.css";

import Home from "./components/Home/Home";
import MyHeader from "./components/Header/MyHeader";
import Footer from "./components/Footer/Footer";
import Cart from "./components/Cart/Cart";
import { CartProvider } from "./context/CartContext";
import { useEffect, useState } from "react";
// import Order from "./components/Order/Order";

function HomeWrapper() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const showThankYou = params.get("thankyou");
   const [visible, setVisible] = useState(!!showThankYou);

  useEffect(() => {
    if (showThankYou) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 5000); // hide after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [showThankYou]);

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

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <MyHeader />
        {/* <Order /> */}

        <Routes>
          <Route path="/" element={<HomeWrapper />} />
          <Route path="/cart" element={<Cart />} />
        </Routes>

        <Footer />
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
