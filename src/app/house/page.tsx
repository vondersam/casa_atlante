export default function TheHome() {
  return (
    <section className="section">
      <div className="content-width">
        <div className="section-header">
          <p className="eyebrow">The house</p>
          <h1>Casa Atlante details</h1>
          <p className="lead">
            Casa Atlante is a beautiful ocean-view holiday rental on La Palma's
            sunny west side, in the Jedey neighbourhood. The 46 m² interior is
            fully renovated, on-grid solar powered, and set up for both relaxed
            stays and remote work.
          </p>
          <p className="lead">
            From the large terrace you can enjoy all-day sun with views to the
            sea and the Cumbre Vieja Natural Park, plus some of the
            island&apos;s most beautiful sunsets and starry skies. Surrounding
            areas are left in their natural state with native plants.
          </p>
        </div>

        <div className="feature-grid">
          <article className="feature-card">
            <h3>General</h3>
            <ul>
              <li>
                Free private parking and extra space at the property entrance
              </li>
              <li>
                Free 40/5 Mbps internet via WiFi and Ethernet for those working
                remotely
              </li>
              <li>100% cotton bed linen, towels, sofa blankets, and pillows</li>
              <li>Plenty of storage in custom-made wooden wardrobes</li>
              <li>Double-glazed windows and doors; on-grid solar power</li>
              <li>
                Environmentally friendly split heat pump with heating, cooling,
                and dehumidifier options
              </li>
              <li>
                Mosquito nets, sun blinds, and curtains on every window;
                handmade recycled-wood furniture throughout
              </li>
            </ul>
          </article>

          <article className="feature-card">
            <h3>Main bedroom</h3>
            <ul>
              <li>Queen size bed (160x200 cm)</li>
              <li>Sliding door framing Atlantic views</li>
              <li>Wooden wardrobe with generous storage</li>
            </ul>
          </article>

          <article className="feature-card">
            <h3>Second bedroom</h3>
            <ul>
              <li>
                Two single beds (90x200 cm) that can be together or separate
              </li>
              <li>Wooden wardrobe with plenty of storage</li>
            </ul>
          </article>

          <article className="feature-card">
            <h3>Bathroom</h3>
            <ul>
              <li>Full bathroom with barrier-free shower, toilet, and sink</li>
              <li>Towel heating rack and washing machine</li>
            </ul>
          </article>

          <article className="feature-card">
            <h3>Kitchen & living</h3>
            <ul>
              <li>Open space with Atlantic and valley views</li>
              <li>
                Flat 40&quot; TV with international satellite and local channels
              </li>
              <li>Three-seater sofa bed; extendable table (120/180x80 cm)</li>
              <li>
                Fully equipped kitchen with fridge-freezer, induction top, and
                oven
              </li>
            </ul>
          </article>

          <article className="feature-card">
            <h3>Outdoors</h3>
            <ul>
              <li>65 m² terrace with ocean and mountain views</li>
              <li>Clothes line to dry clothes outside</li>
              <li>Padded sunbeds and two sun umbrellas</li>
              <li>Two outdoor dining areas with padded chairs</li>
              <li>2500 m² property with native plants</li>
            </ul>
          </article>
        </div>

        <div className="booking-card" style={{ marginTop: "28px" }}>
          <h3>Rates and check-in</h3>
          <ul>
            <li>90 euros per night for two guests</li>
            <li>
              20 euros per night for each additional guest (sleeps max. 4)
            </li>
            <li>Check-out time is 10:00 AM; check-in from 15:00 PM or later</li>
            <li>All prices include tax</li>
            <li>Tourist Licence number: VV-38-5-0001908</li>
          </ul>
          <p>
            You will have access to the entire property. Contact us with any
            questions during your stay using the information sent after booking.
            We speak English, Spanish, and Swedish.
          </p>
        </div>
      </div>
    </section>
  );
}
