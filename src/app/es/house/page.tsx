export default function TheHome() {
  return (
    <section className="section">
      <div className="content-width">
        <div className="section-header">
          <p className="eyebrow">La casa</p>
          <h1>Detalles de Casa Atlante</h1>
          <p className="lead">
            Casa Atlante es una bonita vivienda vacacional con vistas al océano
            en la soleada costa oeste de La Palma, en el barrio de Jedey. Sus 46
            m² interiores están completamente renovados, funcionan con energía
            solar conectada a la red y están preparados tanto para descansar
            como para trabajar en remoto.
          </p>
          <p className="lead">
            Desde la amplia terraza se disfruta del sol durante todo el día, con
            vistas al mar y al Parque Natural de Cumbre Vieja, además de algunos
            de los atardeceres y cielos estrellados más bonitos de la isla. Las
            zonas alrededor de la casa se mantienen en estado natural, con
            plantas autóctonas.
          </p>
        </div>

        <div className="feature-grid">
          <article className="feature-card">
            <h3>General</h3>
            <ul>
              <li>Aparcamiento privado gratuito y espacio extra en la entrada</li>
              <li>
                Internet gratuito de 40/5 Mbps por WiFi y Ethernet para quienes
                trabajan en remoto
              </li>
              <li>Sábanas 100% algodón, toallas, mantas para el sofá y cojines</li>
              <li>Mucho espacio de almacenaje en armarios de madera a medida</li>
              <li>Ventanas y puertas con doble acristalamiento; energía solar</li>
              <li>
                Bomba de calor split eficiente con calefacción, refrigeración y
                deshumidificación
              </li>
              <li>
                Mosquiteras, estores y cortinas en todas las ventanas; muebles
                hechos a mano con madera reciclada
              </li>
            </ul>
          </article>

          <article className="feature-card">
            <h3>Dormitorio principal</h3>
            <ul>
              <li>Cama queen size (160x200 cm)</li>
              <li>Puerta corredera con vistas al Atlántico</li>
              <li>Armario de madera con amplio espacio de almacenaje</li>
            </ul>
          </article>

          <article className="feature-card">
            <h3>Segundo dormitorio</h3>
            <ul>
              <li>
                Dos camas individuales (90x200 cm) que pueden colocarse juntas o
                separadas
              </li>
              <li>Armario de madera con mucho espacio de almacenaje</li>
            </ul>
          </article>

          <article className="feature-card">
            <h3>Baño</h3>
            <ul>
              <li>Baño completo con ducha sin barreras, inodoro y lavabo</li>
              <li>Radiador toallero y lavadora</li>
            </ul>
          </article>

          <article className="feature-card">
            <h3>Cocina y salón</h3>
            <ul>
              <li>Espacio abierto con vistas al Atlántico y al valle</li>
              <li>
                Televisor plano de 40&quot; con canales internacionales por satélite
                y canales locales
              </li>
              <li>Sofá cama de tres plazas; mesa extensible (120/180x80 cm)</li>
              <li>
                Cocina totalmente equipada con frigorífico-congelador, placa de
                inducción y horno
              </li>
            </ul>
          </article>

          <article className="feature-card">
            <h3>Exterior</h3>
            <ul>
              <li>Terraza de 65 m² con vistas al océano y a la montaña</li>
              <li>Tendedero exterior</li>
              <li>Tumbonas acolchadas y dos sombrillas</li>
              <li>Dos zonas de comedor exterior con sillas acolchadas</li>
              <li>Parcela de 2500 m² con plantas autóctonas</li>
            </ul>
          </article>
        </div>

        <div className="booking-card" style={{ marginTop: "28px" }}>
          <h3>Precios y llegada</h3>
          <ul>
            <li>90 euros por noche para dos huéspedes</li>
            <li>20 euros por noche por cada huésped adicional (máximo 4)</li>
            <li>
              Los precios no incluyen IGIC (IVA), que es del 7% y se añade al
              precio final
            </li>
            <li>Salida a las 10:00; entrada desde las 15:00 en adelante</li>
            <li>Número de licencia turística: VV-38-5-0001908</li>
          </ul>
          <p>
            Tendrás acceso a toda la propiedad. Contacta con nosotros si tienes
            cualquier pregunta durante tu estancia usando la información enviada
            después de la reserva. Hablamos español, inglés y sueco.
          </p>
        </div>
      </div>
    </section>
  );
}
