import React from 'react'
import "./AboutUs.scss";
function AboutUs() {
  return (
    <section className="AboutUs" id="AboutUs">
        <div className="container-fluid">
            <div className="container text-center">
                <h2 className='AboutUsHeading'>At Aha! Rasam, we believe life’s best comforts 
                    <br></br>don’t need invention, only rediscovery.
                </h2>
                <div className="row ">
                    <div className="col-lg-6 col-md-6 col-sm-12">
                        <p className='text-start'>
                            For us, rasam is more than a beverage, it’s a heritage passed down <br></br> through generations, a perfect balance of flavor, nourishment, and <br></br> care that has long been a part of Indian kitchens.
                        </p>
                    </div>
                    <div className="col-lg-6 col-md-6 col-sm-12">
                        <p className='text-start'>
                           We honor this tradition by crafting each cup with authentic <br></br> ingredients like toor dal, tamarind, pepper, and curry leaves, <br></br> preserving its wholesome essence while making it accessible for <br></br> modern life. We celebrate this heritage by keeping its spirit alive in <br></br> every cup, connecting people to the simple joys and mindful living <br></br> of the past.
                        </p>
                    </div>
                </div>
                <h5 className='subheading'>
                    And because we believe that goodness is meant to be shared, every <br></br> 
                    sip contributes to social impact, supporting education, healthcare,<br></br> 
                    temple preservation, Gau Samrakshana, and the welfare of ex-army <br></br> 
                    families, turning a simple daily ritual into a gesture of care for the<br></br>  wider community.
                </h5>
            </div>
        </div>
    </section>

    
  )
}

export default AboutUs