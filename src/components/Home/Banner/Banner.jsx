import "./Banner.scss";
import bannerImg from  "../../../assets/banner-image.png";
import mob1 from  "../../../assets/1.png";
import mob2 from  "../../../assets/2.png";
import mob3 from  "../../../assets/3.png";
import leftpoint from "../../../assets/left-point.png"
import Rightpoints from "../../../assets/right-point.png"
import mob4 from  "../../../assets/4.png";
import mob5 from  "../../../assets/5.png";
import mob6 from  "../../../assets/6.png";
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
        <div className="banner-box2 container d-sm-none d-md-flex  d-lg-flex">
            <div className="sec-1">
                <img src={leftpoint} className="sec1img" alt="Heart" />
            </div>

            <div className="sec-2">
            <img src={bannerImg} alt="Rasam Bowl" style={{ transform: `rotate(${rotation}deg)`,
                transition: "transform 0.1s linear"}}
            />
            </div>

            <div className="sec-3">
                <img src={Rightpoints} className="sec3img" alt="Boosts Immunity" />
            </div>

        </div>
        <div className="banner-box3 container ">
            <div className="row">
                <div className="sec-1 col-12">
                    <img src={bannerImg} alt="Rasam Bowl" style={{ transform: `rotate(${rotation}deg)`,transition: "transform 0.1s linear"}}/>
                </div>
                <div className="sec-2 col-6">
                    <img src={mob1} className="sec11img" alt="Heart" />
                    <img src={mob3} className="sec12img" alt="Digestive" />
                    <img src={mob5} className="sec13img" alt="Improves" />
                </div>

                <div className="sec-3 col-6">
                <img src={mob2} className="sec31img" alt="Boosts Immunity" />
                <img src={mob4} className="sec32img" alt="Rich in Antioxidants" />
                <img src={mob6} className="sec33img" alt="Other" />
            </div>

            </div>
            

            

            

        </div>

    </section>;
};

export default Banner;
