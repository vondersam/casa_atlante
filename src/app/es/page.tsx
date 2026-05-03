"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import ImageLightbox from "@/app/components/image-lightbox";
import getAlt from "@/app/helpers/getAlt";
import { useLocale } from "@/i18n/context";
import { localizePath } from "@/i18n/path";

const galleryImages = [
  "/gallery/casa-atlante-front.jpg",
  "/gallery/main-room-ocean-view.jpg",
  "/gallery/open-space-kitchen.jpg",
  "/gallery/sunbeds-on-terrace.jpg",
  "/gallery/front-house-terrace.jpg",
  "/gallery/kitchen-and-living-room.jpg",
  "/gallery/ocean-view-with-outdoor-table.jpg",
  "/gallery/view-from-living-room.jpg",
  "/gallery/house-main-entrance-with-sunset.jpg",
  "/gallery/bathroom.jpg",
  "/gallery/lava-field.jpg",
  "/gallery/cumbre-vieja-natural-park.jpg",
  "/gallery/living-room-sun.jpeg",
  "/gallery/bathroom-with-shower.jpg",
  "/gallery/living-room.jpg",
  "/gallery/sunset-from-second-terrace.jpg",
  "/gallery/afternoon-terrace.jpg",
  "/gallery/aenium-bejeque.jpeg",
  "/gallery/casa-atlante-name.jpeg",
  "/gallery/gr-130-jedey.jpeg",
  "/gallery/ruta-de-los-volcanes.jpeg",
  "/gallery/stargazing.jpeg",
];

const introImage = "/carousel/house-front-entrance.jpg";
const trailsImage = "/gallery/cumbre-vieja-natural-park.jpg";
const oceanImage = "/carousel/sunset-on-ocean-view.jpg";
const essentialsImage = "/carousel/los-llanos-de-aridane.jpg";

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const locale = useLocale();

  return (
    <>
      <section className="hero">
        <div className="content-width">
          <p className="eyebrow">La Palma, Islas Canarias</p>
          <h1>Casa Atlante</h1>
          <p>
            Una casa con vistas al océano y energía solar en el tranquilo barrio
            de Jedey, rodeada por el horizonte atlántico y el Parque Natural de
            Cumbre Vieja.
          </p>
          <div className="hero-actions">
            <a className="btn" href="#booking">
              Reserva tu estancia
            </a>
            <a className="btn secondary" href="#gallery">
              Ver la casa
            </a>
          </div>
        </div>
      </section>

      <section className="section" id="house">
        <div className="content-width split-grid">
          <div>
            <p className="eyebrow">Nuestra historia</p>
            <h2>Vida tranquila sobre el Atlántico</h2>
            <p>
              Casa Atlante es una vivienda de 46 m² totalmente renovada,
              pensada para días tranquilos y sin prisas. Sus grandes terrazas
              enmarcan vistas infinitas al océano, mientras el interior es
              luminoso, sencillo y está amueblado con piezas que construimos
              nosotros mismos.
            </p>
            <p>
              La casa se renovó en 2023 y funciona con energía solar conectada
              a la red. Las ventanas de doble acristalamiento, mosquiteras,
              contraventanas y tejidos naturales mantienen el espacio cómodo y
              ventilado durante todo el año, tanto si vienes a descansar como a
              trabajar en remoto.
            </p>
          </div>

          <div className="stacked-images">
            <div className="image-frame aspect-16-10">
              <Image
                src={introImage}
                alt={getAlt(introImage, "es")}
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                className="media-fill"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section muted" id="stay">
        <div className="content-width">
          <div className="section-header">
            <p className="eyebrow">Tu estancia</p>
            <h2>Diseñada para días cómodos y sin prisas</h2>
            <p className="lead">
              Desde paseos al amanecer hasta atardeceres lentos, Casa Atlante
              está preparada para parejas, amistades o personas que trabajan en
              remoto y buscan una base tranquila con todo a mano.
            </p>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <h3>La casa</h3>
              <ul>
                <li>
                  2 dormitorios: cama queen en la habitación principal y dos
                  camas individuales en la segunda
                </li>
                <li>Cocina abierta y salón luminoso con vistas al Atlántico</li>
                <li>Televisor plano de 40&quot; con canales internacionales y sofá cama</li>
                <li>Muebles de madera a medida y mucho espacio de almacenaje</li>
              </ul>
            </article>
            <article className="feature-card">
              <h3>Comodidad</h3>
              <ul>
                <li>Energía solar conectada a la red, doble acristalamiento y bomba de calor</li>
                <li>Sábanas 100% algodón, toallas, mantas y cojines decorativos</li>
                <li>Internet gratuito de 40/5 Mbps por WiFi y Ethernet para trabajar en remoto</li>
                <li>Mosquiteras, contraventanas y cortinas en todas las habitaciones</li>
              </ul>
            </article>
            <article className="feature-card">
              <h3>Exterior</h3>
              <ul>
                <li>Terraza de 65 m² con sol todo el día y vistas del océano a la montaña</li>
                <li>Tumbonas acolchadas, sombrillas y dos zonas de comedor exterior</li>
                <li>Parcela de 2500 m² con plantas autóctonas en estado natural</li>
                <li>Aparcamiento privado y acceso fácil a senderos</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="section" id="surroundings">
        <div className="content-width">
          <div className="section-header">
            <p className="eyebrow">El entorno</p>
            <h2>Entre el Atlántico y Cumbre Vieja</h2>
            <p className="lead">
              Casa Atlante se encuentra en la tranquila zona de Jedey, dentro de
              la Red Natura 2000 de Tamanca. Los senderos empiezan a la puerta
              de casa, y las playas, pueblos y campos de lava están a pocos
              minutos en coche.
            </p>
          </div>

          <div className="story-grid">
            <article className="story-card">
              <div className="image-frame aspect-16-10">
                <Image
                  src={trailsImage}
                  alt={getAlt(trailsImage, "es")}
                  fill
                  sizes="(max-width: 900px) 100vw, 32vw"
                  className="media-fill"
                />
              </div>
              <h3>Senderos desde la puerta</h3>
              <p>
                Camina por el Parque Natural de Cumbre Vieja y el paisaje
                protegido de Tamanca directamente desde la casa. La zona es un
                mar de tranquilidad, con vistas en todas direcciones.
              </p>
            </article>
            <article className="story-card">
              <div className="image-frame aspect-16-10">
                <Image
                  src={oceanImage}
                  alt={getAlt(oceanImage, "es")}
                  fill
                  sizes="(max-width: 900px) 100vw, 32vw"
                  className="media-fill"
                />
              </div>
              <h3>Playas y océano</h3>
              <p>
                Las playas de Puerto Naos y Charco Verde están a unos 15
                minutos en coche, Puerto de Tazacorte a 25 minutos y las playas
                salvajes de Fuencaliente a unos 30 minutos. La terraza mira al
                Atlántico para disfrutar de atardeceres dorados.
              </p>
            </article>
            <article className="story-card">
              <div className="image-frame aspect-16-10">
                <Image
                  src={essentialsImage}
                  alt={getAlt(essentialsImage, "es")}
                  fill
                  sizes="(max-width: 900px) 100vw, 32vw"
                  className="media-fill"
                />
              </div>
              <h3>Servicios cercanos</h3>
              <p>
                El Paso y Los Llanos están a 20 minutos en coche. Los
                supermercados de Fuencaliente quedan a 15 minutos, y una tienda
                local a un minuto de la casa cubre las necesidades diarias.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section muted" id="gallery">
        <div className="content-width">
          <div className="section-header">
            <p className="eyebrow">Galería</p>
            <h2>Casa Atlante en imágenes</h2>
            <p className="lead">
              Las contraventanas, mosquiteras y cortinas se añadieron después
              de tomar algunas de estas fotos. Cada estancia está preparada para
              privacidad, comodidad y luz suave.
            </p>
          </div>

          <div className="gallery-grid">
            {galleryImages.map((src) => {
              const description = getAlt(src, "es");

              return (
                <div
                  key={src}
                  className="gallery-card"
                  onClick={() => setSelectedImage(src)}
                  role="button"
                  tabIndex={0}
                  aria-label={description}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" && e.key !== " ") return;

                    e.preventDefault();
                    setSelectedImage(src);
                  }}
                >
                  <Image
                    src={src}
                    alt={description}
                    fill
                    sizes="(max-width: 768px) 100vw, 30vw"
                    className="media-fill"
                  />
                </div>
              );
            })}
          </div>

          <div className="hero-actions" style={{ marginTop: "22px" }}>
            <Link className="btn secondary" href={localizePath("/gallery", locale)}>
              Ver galería completa
            </Link>
          </div>
        </div>
      </section>

      <section className="section" id="press">
        <div className="content-width">
          <div className="section-header">
            <p className="eyebrow">Lo que destacan los huéspedes</p>
            <h2>Luz, calma y conexión con la naturaleza</h2>
            <p className="lead">
              Casa Atlante combina vistas al horizonte oceánico con acabados
              cuidados. Es un lugar para bajar el ritmo, trabajar con vistas y
              compartir largas comidas al aire libre.
            </p>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <h3>Atardeceres sin interrupciones</h3>
              <p>
                Las terrazas orientadas al oeste reciben sol durante todo el día
                y se vuelven doradas cada tarde, perfectas para cenas lentas o
                para mirar las estrellas.
              </p>
            </article>
            <article className="feature-card">
              <h3>Hecha con cuidado</h3>
              <p>
                Gran parte del mobiliario está hecho a mano con madera
                recuperada, lo que da a la casa un ambiente cálido y personal.
              </p>
            </article>
            <article className="feature-card">
              <h3>Tranquila, pero conectada</h3>
              <p>
                Internet rápido, rincones cómodos para trabajar y el silencio
                del paisaje de Jedey hacen fácil descansar o concentrarse.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section muted" id="to-do">
        <div className="content-width">
          <div className="section-header">
            <p className="eyebrow">Qué hacer en la zona</p>
            <h2>Explora la costa oeste de La Palma</h2>
            <p className="lead">
              Baños en el océano, rutas volcánicas y restaurantes de pueblo
              están muy cerca. Algunas ideas para empezar:
            </p>
          </div>

          <div className="list-grid">
            <article>
              <h3>Restaurantes</h3>
              <p>
                La Palma tiene una gran oferta de buenos restaurantes. Cerca de
                la casa destacan Bodegón Tamanca y Restaurante El Secadero para
                recetas locales, además de El Trébol y La Taberna del Puerto en
                Puerto de Tazacorte cuando apetece pescado y marisco.
              </p>
            </article>
            <article>
              <h3>Playas</h3>
              <p>
                Playa Puerto Naos y El Charco Verde están a unos 15 minutos, con
                El Remo un poco más allá. Puerto de Tazacorte combina arena y
                restaurantes, mientras la costa de Fuencaliente esconde Playa
                Zamora (Chica y Grande) y Playa de Echentive, cerca del faro y
                las salinas.
              </p>
            </article>
            <article>
              <h3>Volcanes</h3>
              <p>
                Casa Atlante se encuentra sobre el campo de lava de Tihuya de
                1585, con vistas a El Canalizo y a las coladas de El Charco de
                1712 hacia el sur. Tajogaite (2021) está a 5 minutos, junto al
                centro de interpretación Caños de Fuego y las cuevas volcánicas
                de San Juan. Fuencaliente (15 minutos) suma Teneguía (1971) a
                la lista.
              </p>
              <p>Recorre la Ruta de Los Volcanes, de 17,5 km, por Cumbre Vieja.</p>
            </article>
            <article>
              <h3>Las estrellas</h3>
              <p>
                Los cielos suelen estar increíblemente despejados. Observa las
                estrellas desde Casa Atlante o sube a El Roque de Los Muchachos,
                donde están los observatorios. Una opción más cercana es el
                Mirador Astronómico del Llano del Jable, a unos 45 minutos.
              </p>
            </article>
            <article>
              <h3>El norte</h3>
              <p>
                La Palma cambia de carácter en el norte. Explora El Cubo de la
                Galga y Los Tilos para disfrutar de bosques de laurisilva y
                rutas a la sombra.
              </p>
            </article>
            <article>
              <h3>La Caldera de Taburiente</h3>
              <p>Una joya de parque nacional que merece disfrutarse acampando una noche.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section" id="booking">
        <div className="content-width split-grid">
          <div>
            <div className="section-header">
              <p className="eyebrow">Reservas</p>
              <h2>¿Listo para alojarte en Casa Atlante?</h2>
              <p className="lead">
                Envíanos tus fechas y el número de huéspedes. Confirmaremos la
                disponibilidad y compartiremos todos los detalles de llegada.
              </p>
            </div>

            <div className="booking-card">
              <p>
                Tarifas: 90 € por noche para dos huéspedes. 20 € por noche por
                cada huésped adicional (hasta 4).
              </p>
              <p>Entrada desde las 15:00; salida antes de las 10:00.</p>
              <div className="hero-actions">
                <Link className="btn secondary" href={localizePath("/booking", locale)}>
                  Consultar disponibilidad
                </Link>
              </div>
            </div>
          </div>

          <div>
            <div className="section-header" style={{ marginBottom: "18px" }}>
              <p className="eyebrow">Ubicación</p>
              <h2>Jedey, La Palma</h2>
              <p className="lead">
                Un lugar tranquilo con trayectos sencillos a El Paso y Los
                Llanos (30-45 minutos), Fuencaliente (15 minutos) y las playas
                de la costa oeste.
              </p>
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
        </div>
      </section>

      <ImageLightbox
        images={galleryImages}
        selectedImage={selectedImage}
        onSelect={setSelectedImage}
        onClose={() => setSelectedImage(null)}
        closeLabel="Cerrar"
        locale="es"
      />
    </>
  );
}
