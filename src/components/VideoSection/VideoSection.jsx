import React from 'react'
import "./VideoSection.scss";
import videobgimg from "../../assets/videobgimg.png";

function VideoSection() {
  return (
     <section className="VideoSection" id="VideoSection">
      <div className="container-fluid">
      <div className="container">
        <div className="row videopart">
          {/* align-items-center */}
          <div className="col-lg-6 col-md-6 col-sm-12 text-center videoimg">
              <iframe width="337" height="599" src="https://www.youtube.com/embed/Dj1wkE9GBUg" title="How to make a perfect Rasam | AHA! I Rasam" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen >
              <img src={videobgimg} alt="Watch Rasam Video" className="VideoSectionimg" />
              </iframe>
              {/* <a href="https://www.youtube.com/watch?v=Dj1wkE9GBUg" target="_blank">
                <img src={videobgimg} alt="Watch Rasam Video" className="VideoSectionimg" />
              </a> */}

          </div>
          <div className="col-lg-6 col-md-6 col-sm-12 videoinfo">
            <div className="spacer"></div>
            <h3 className="videosectionheading">Make the Perfect Rasam!</h3>
            <p className="videosectionpara">
              Treat your family and friends to this authentic Rasam recipe. Simple to make, bursting with flavor, and truly divine in taste! Let’s cook!
            </p>
          </div>
        </div>
      </div>
        

      </div>
    </section>
  )
}

export default VideoSection