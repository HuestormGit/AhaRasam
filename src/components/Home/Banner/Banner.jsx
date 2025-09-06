import "./Banner.scss";
import bannerImg from  "../../../assets/banner-image.png";
import sec11 from  "../../../assets/sec11.png";
import sec12 from  "../../../assets/sec12.png";
import sec13 from  "../../../assets/sec13.png";
import sec31 from  "../../../assets/sec11.png";
import sec32 from  "../../../assets/sec12.png";
import sec33 from  "../../../assets/sec13.png";
import { useEffect, useState } from "react";


const Banner = () => {
    const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setRotation((window.scrollY / 3) % 360); 
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

    return <section className="hero-banner">
        <div className="banner-box container-fluid">
            <div className=" text-center">
                <h1 className="banner-heading">
                    A Sip of Tradition, <br></br>A Taste of Wellness
                </h1>
                <h6 className="sub-heading">
                    Healthy replacement of tea or Coffee
                </h6>
            </div>

        </div>
        <div className="banner-box2 container">
            <div className="sec-1">
                <img src={sec11} className="sec11img" alt="Healthy replacement of tea or Coffee" />
                <img src={sec12} className="sec12img" alt="Healthy replacement of tea or Coffee" />
                <img src={sec13} className="sec13img" alt="Healthy replacement of tea or Coffee" />

            </div>
            <div className="sec-2">
                <img src={bannerImg} alt="Healthy replacement of tea or Coffee" style={{
                    transform: `rotate(${rotation}deg)`,transition: "transform 0.1s linear"}} />

            </div>
            <div className="sec-3">
                 <img src={sec31} className="sec31img" alt="Healthy replacement of tea or Coffee" />
                <img src={sec32} className="sec32img" alt="Healthy replacement of tea or Coffee" />
                <img src={sec33} className="sec33img" alt="Healthy replacement of tea or Coffee" />
            </div>
        </div>

    </section>;
};

export default Banner;
