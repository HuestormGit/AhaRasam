import React from 'react'
import "./Home.scss";
import Banner from './Banner/Banner';
import VideoSection from '../VideoSection/VideoSection';
import Contact from '../Contact/Contact';
import Products from '../Products/Products';
import AboutUs from '../AboutUs/AboutUs';

function Home() {
  return (
    <div className="home">
      <Banner />
      <Products />
      <div className="spacer"></div>
      <VideoSection />
      <AboutUs/>
      <Contact />
    </div>
  )
}

export default Home
