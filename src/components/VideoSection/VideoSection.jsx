import React from 'react'
import "./VideoSection.scss";
import videobgimg from "../../assets/videobgimg.png";

function VideoSection() {
  return (
     <section className="VideoSection" id="VideoSection">
      <div className="container-fluid">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-5 col-md-12 text-center">
              {/* <iframe width="337" height="599" src="https://www.youtube.com/embed/Dj1wkE9GBUg" title="How to make a perfect Rasam | AHA! Rasam" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen ></iframe> */}
              <a href="https://www.youtube.com/watch?v=Dj1wkE9GBUg" target="_blank">
                <img src={videobgimg} alt="Watch Rasam Video" width="337" height="599" className="VideoSectionimg" />
              </a>

          </div>
          <div className="col-lg-7 col-md-12">
            <h3 className="videosectionheading">How to make a perfect Rasam</h3>
          <p className="videosectionpara">
           Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus dictum, mi non maximus accumsan, tortor nunc laoreet dolor, ac ullamcorper massa lacus vel felis.
          </p>
          </div>
        </div>
      </div>
        

      </div>
    </section>
  )
}

export default VideoSection