import React from 'react'
import "./Home.scss";
import Banner from './Banner/Banner';
import VideoSection from '../VideoSection/VideoSection';
import Contact from '../Contact/Contact';
import Products from '../Products/Products';
// import Checkout from "../Checkout/Checkout";
import { useState } from "react";
import AboutUs from '../AboutUs/AboutUs';

function Home() {
  const [cart, setCart] = useState([]);

  const handleAddToCart = (item) => {
    setCart((prev) => [...prev, item]);
  };
  return (
    <div className="home">
      <Banner />
      <Products onAddToCart={handleAddToCart} />
      <div className="spacer"></div>
      <VideoSection />
      <AboutUs/>
      <Contact />
    </div>
  )
}

export default Home