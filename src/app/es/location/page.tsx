export default function Location() {
  return (
    <section className="section">
      <div className="content-width split-grid">
        <div>
          <div className="section-header">
            <p className="eyebrow">Ubicación</p>
            <h1>Jedey, La Palma</h1>
            <p className="lead">
              Casa Atlante se encuentra en la Red Natura 2000 de Tamanca, en el
              oeste de La Palma, una base tranquila para días de playa y rutas
              de montaña. Muchas rutas de senderismo empiezan justo al salir de
              la casa.
            </p>
          </div>

          <p>
            El Paso y Los Llanos de Aridane están a 30 minutos en coche. El
            supermercado más cercano, en Fuencaliente, está a 15 minutos, y una
            pequeña tienda local a un minuto cubre lo esencial. Las playas de
            Puerto Naos y Charco Verde están a unos 15 minutos, Puerto de
            Tazacorte a 25 minutos y las playas más salvajes de Fuencaliente a
            unos 30 minutos. El volcán Tajogaite de 2021 y los campos de lava
            cercanos están aproximadamente a 3 km.
          </p>

          <div className="hero-actions" style={{ marginTop: "18px" }}>
            <a
              className="btn secondary"
              href="https://maps.app.goo.gl/BiCx97GW2YJdooCM9"
              target="_blank"
              rel="noreferrer"
            >
              Abrir en Google Maps
            </a>
          </div>
        </div>

        <div className="map-embed">
          <iframe
            title="Ubicación de Casa Atlante"
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
