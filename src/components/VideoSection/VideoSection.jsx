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
              {/* <iframe className="VideoSectionimg" width="337" height="599" src="https://www.youtube.com/embed/Dj1wkE9GBUg" title="How to make a perfect Rasam | AHA! I Rasam" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen >
              
              </iframe> */}
              <a href="https://www.youtube.com/watch?v=Dj1wkE9GBUg" target="_blank" rel="noreferrer">
                <img src={videobgimg} alt="Watch Rasam Video" className="VideoSectionimg" />
              </a>

          </div>
          <div className="col-lg-6 col-md-6 col-sm-12 videoinfo">
            <div className="spacer"></div>
            {/* <h3 className="videosectionheading">Make the Perfect Rasam!</h3> */}
            <h3 className="videosectionheading">Not just a perfect Rasam. <br></br>It’s a universal flavour!</h3>
            <p className="videosectionpara">
                Yes, it makes a soul-warming, authentic bowl of Rasam bursting with flavour and truly divine in taste! So, treat your family to a timeless South Indian classic, or get creative and simmer it into your daily sabzi or your midnight Maggi for an Aha! upgrade. Sip it or simmer it; let's get cooking!
              {/* Yes, it makes a soul-warming, perfectly authentic bowl of Rasam bursting with flavour and truly divine in taste! So, treat your family to a divine South Indian classic, or go creative and sprinkle it into your daily sabzi or your midnight Maggi for an Aha! upgrade. Brew it or sprinkle it; let's get cooking! */}
              {/* Treat your family and friends to this authentic Rasam recipe. Simple to make, bursting with flavor, and truly divine in taste! Let’s cook! */}
            </p>
          </div>
        </div>
      </div>
        

      </div>
    </section>
  )
}

export default VideoSection
