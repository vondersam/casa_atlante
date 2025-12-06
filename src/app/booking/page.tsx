import AvailabilityCalendar from "../components/availability-calendar";

export default function Booking() {
  return (
    <section className="section">
      <div className="content-width">
        <div className="section-header">
          <p className="eyebrow">Booking</p>
          <h1>Plan your stay</h1>
          <p className="lead">
            Check real-time availability, then email us your travel dates and
            number of guests. We&apos;ll confirm rates and arrival details.
          </p>
        </div>

        <div className="split-grid">
          <div className="booking-card webhook-card">
            <AvailabilityCalendar />
          </div>
          <div className="booking-card">
            <p>
              Rates: 90 € per night for two guests, plus 20 € per night for each
              additional guest (up to 4). 7% IGIC (VAT) of total price.
            </p>
            <p>Check-in from 15:00; check-out by 10:00.</p>
            <p>Tourist Licence number: VV-38-5-0001908.</p>
            <div className="hero-actions">
              <a className="btn" href="mailto:booking@casa-atlante.com">
                Booking request
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
