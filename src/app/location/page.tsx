export default function Location() {
  return (
    <section className="section">
      <div className="content-width split-grid">
        <div>
          <div className="section-header">
            <p className="eyebrow">Location</p>
            <h1>Jedey, La Palma</h1>
            <p className="lead">
              Casa Atlante sits in the Red Natura 2000 of Tamanca on La Palma’s
              west side, a peaceful base for beach days and mountain walks. Many
              hiking trails start right outside the door.
            </p>
          </div>

          <p>
            El Paso and Los Llanos de Aridane are 30 minutes away by car. The
            closest supermarket, in Fuencaliente, is a 15-minute drive, and a
            small local shop one minute away covers essentials. Puerto Naos and
            Charco Verde beach are about 15 minutes away, Puerto de Tazacorte 25
            minutes, and the wilder Fuencaliente beaches around 30 minutes. The
            2021 Tajogaite volcano and nearby lava fields are roughly 3 km away.
          </p>

          <div className="hero-actions" style={{ marginTop: "18px" }}>
            <a
              className="btn secondary"
              href="https://maps.app.goo.gl/BiCx97GW2YJdooCM9"
              target="_blank"
              rel="noreferrer"
            >
              Open in Google Maps
            </a>
          </div>
        </div>

        <div className="map-embed">
          <iframe
            title="Casa Atlante location"
            src="https://www.google.com/maps?q=28.576755825093613,-17.877278973588894&z=12&output=embed"
            width="100%"
            height="100%"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
