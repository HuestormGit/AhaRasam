import React from 'react'
import "./AboutUs.scss";
function AboutUs() {
  return (
    <section className="AboutUs" id="AboutUs">
        <div className="container-fluid">
            <div className="container text-center">
                <h2 className='AboutUsHeading'>At Aha! Rasam, we believe life’s best comforts 
                    don’t need invention, only rediscovery.
                </h2>
                <div className="row pt-50">
                    <div className="col-lg-1 col-md-1 col-sm-12"></div>
                    <div className="col-lg-5 col-md-5 col-sm-12">
                        <p>
                            For us, rasam is more than a beverage, it’s a heritage passed down <br></br> through generations, a perfect balance of flavor, nourishment, and <br></br> care that has long been a part of Indian kitchens.
                        </p>
                    </div>
                    <div className="col-lg-5 col-md-5 col-sm-12">
                        <p>
                           We honor this tradition by crafting each cup with authentic <br></br> ingredients like toor dal, tamarind, pepper, and curry leaves, <br></br> preserving its wholesome essence while making it accessible for <br></br> modern life. We celebrate this heritage by keeping its spirit alive in <br></br> every cup, connecting people to the simple joys and mindful living <br></br> of the past.
                        </p>
                    </div>
                    <div className="col-lg-1 col-md-1 col-sm-12"></div>

                </div>
                <h5>
                    And because we believe that goodness is meant to be shared, every sip contributes to social impact, supporting education, healthcare, temple preservation, Gau Samrakshana, and the welfare of ex-army families, turning a simple daily ritual into a gesture of care for the wider community.               
                </h5>
            </div>
        </div>
    </section>

    
  )
}

export default AboutUs