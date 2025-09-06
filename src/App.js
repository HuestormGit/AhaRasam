import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import "./App.css";

import Home from "./components/Home/Home";
import MyHeader from "./components/Header/MyHeader";
import Footer from "./components/Footer/Footer";
import Cart from "./components/Cart/Cart";
import { CartProvider } from "./context/CartContext";
// import Order from "./components/Order/Order";

function HomeWrapper() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const showThankYou = params.get("thankyou");

  return (
    <>
      {showThankYou && (
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
