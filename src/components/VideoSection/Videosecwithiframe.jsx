import React, { useState } from "react";
import "./VideoSection.scss";
import videobgimg from "../../assets/videobgimg.png";

function VideoSection() {
  const [play, setPlay] = useState(false);

  return (
    <section className="VideoSection" id="VideoSection">
      <div className="container-fluid">
        <div className="container">
          <div className="row videopart">
            <div className="col-lg-6 col-md-6 col-sm-12 text-center videoimg">

              {/* VIDEO WRAPPER */}
              <div className="video-wrapper">

                {/* IMAGE OVERLAY */}
                {!play && (
                  <div className="overlay" onClick={() => setPlay(true)}>
                    <img
                      src={videobgimg}
                      alt="Watch Rasam Video"
                      className="overlay-img"
                    />
                    <div className="play-btn">▶</div>
                  </div>
                )}

                {/* IFRAME */}
                <iframe
                  className="VideoSectionimg"
                  width="337"
                  height="599"
                  src={
                    play
                      ? "https://www.youtube.com/embed/Dj1wkE9GBUg?autoplay=1"
                      : "https://www.youtube.com/embed/Dj1wkE9GBUg"
                  }
                  title="How to make a perfect Rasam | AHA! I Rasam"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>

            </div>

            <div className="col-lg-6 col-md-6 col-sm-12 videoinfo">
              <div className="spacer"></div>
              <h3 className="videosectionheading">Make the Perfect Rasam!</h3>
              <p className="videosectionpara">
                Treat your family to this authentic Rasam recipe. Simple to make, bursting with flavor, and truly divine in taste! Let’s cook!
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default VideoSection;
