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
                    <div className="col-6">
                        <p className='text-start'>
                            For us, rasam is more than a beverage, it’s a heritage passed down through generations, a perfect balance of flavor, nourishment, and care that has long been a part of Indian kitchens.
                        </p>
                    </div>
                    <div className="col-6">
                        <p className='text-start'>
                           We honor this tradition by crafting each cup with authentic ingredients like toor dal, tamarind, pepper, and curry leaves, preserving its wholesome essence while making it accessible for modern life. We celebrate this heritage by keeping its spirit alive in every cup, connecting people to the simple joys and mindful living of the past.
                        </p>
                    </div>
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