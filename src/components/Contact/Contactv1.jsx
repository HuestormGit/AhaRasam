import React from "react";
import "./Contact.scss";
import logo from "../../assets/contactsection.png";

function Contact() {
  return (
    <section className="contact-section" id="Contact">
      <div className="container">
        {/* LEFT FORM BOX */}
        <div className="contact-form-box">
          <h2 className="form-title">Enquiry</h2>
          <p className="form-subtitle">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>

          <form className="contact-form">
            <div className="form-group">
              <input type="text" id="name" required placeholder="Name " />
              {/* <label htmlFor="name">Name</label> */}
            </div>

            <div className="form-group">
              <input type="email" id="email" required placeholder="Email Id " />
              {/* <label htmlFor="email">Email Id</label> */}
            </div>

            <div className="form-group">
              <input type="tel" id="phone" required placeholder="Phone no. " />
              {/* <label htmlFor="phone">Phone no.</label> */}
            </div>

            <div className="form-group radio-group">
              <label>Want to</label>
              <label>
                <input type="radio" name="action" value="buy" defaultChecked />{" "}
                <span> Buy </span>
              </label>
              <label>
                <input type="radio" name="action" value="sell" /> <span> Sell </span>
              </label>
            </div>

            <div className="form-group">
              <textarea id="message" required placeholder="Write here "></textarea>
              {/* <label htmlFor="message">Write here</label> */}
            </div>
            <div className="btn-container">
                <button type="submit" className="btn-submit"> Submit </button>
            </div>
            
          </form>
        </div>

        {/* RIGHT INFO BOX */}
        <div className="contact-info">
          <img src={logo} alt="Aha Rasam" className="company-logo" />
          <h3 className="company-name">Aha! Rasam</h3>
          <p className="company-address">
            Gut No. 65, Property No. 317, Siddheshwar BK, Pali - Bhira Road,
            <br />
            Taluka Sudhagad, District Raigarh, Maharashtra,
            <br />
            India, 410205
          </p>
        </div>
      </div>
    </section>
  );
}

export default Contact;
