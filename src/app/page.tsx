"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import getAlt from "./helpers/getAlt";

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

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <>
      <section className="hero">
        <div className="content-width">
          <p className="eyebrow">La Palma, Canary Islands</p>
          <h1>Casa Atlante</h1>
          <p>
            An ocean-view, solar-powered home in the quiet Jedey neighbourhood,
            surrounded by the Atlantic horizon and the Cumbre Vieja Natural
            Park.
          </p>
          <div className="hero-actions">
            <a className="btn" href="#booking">
              Book your stay
            </a>
            <a className="btn secondary" href="#gallery">
              See the house
            </a>
          </div>
        </div>
      </section>

      <section className="section" id="house">
        <div className="content-width split-grid">
          <div>
            <p className="eyebrow">Our story</p>
            <h2>Slow living above the Atlantic</h2>
            <p>
              Casa Atlante is a fully renovated 46 m² home designed for calm,
              unrushed days. Large terraces frame endless ocean views, while the
              interior is bright, pared back and thoughtfully furnished with
              pieces we built ourselves.
            </p>
            <p>
              The house was renewed in 2023 and runs on on-grid solar power.
              Double-glazed windows, mosquito nets, shutters, and natural
              fabrics keep the space airy and comfortable year-round, whether
              you&apos;re here to rest or work remotely.
            </p>
          </div>

          <div className="stacked-images">
            <div className="image-frame aspect-16-10">
              <Image
                src="/carousel/house-front-entrance.jpg"
                alt="Casa Atlante entrance with ocean backdrop"
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
            <p className="eyebrow">Your stay</p>
            <h2>Designed for unrushed, comfortable days</h2>
            <p className="lead">
              From sunrise walks to slow sunsets, Casa Atlante is set up for
              couples, friends, or remote workers looking for a quiet base with
              everything within easy reach.
            </p>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <h3>The house</h3>
              <ul>
                <li>
                  2 bedrooms: queen bed in the main room, two single beds in the
                  second
                </li>
                <li>Bright open kitchen and living area with Atlantic views</li>
                <li>
                  Flat 40&quot; TV with international channels and sofa bed
                </li>
                <li>Custom wooden furniture and plenty of storage</li>
              </ul>
            </article>
            <article className="feature-card">
              <h3>Comfort</h3>
              <ul>
                <li>On-grid solar power, double-glazed windows, heat pump</li>
                <li>
                  100% cotton bed linen, towels, blankets, decorative pillows
                </li>
                <li>
                  Free 40/5 Mbps internet via WiFi and Ethernet for remote work
                </li>
                <li>Mosquito nets, shutters, and curtains in every room</li>
              </ul>
            </article>
            <article className="feature-card">
              <h3>Outdoors</h3>
              <ul>
                <li>
                  65 m² terrace with all-day sun and ocean-to-mountain views
                </li>
                <li>
                  Padded sunbeds, umbrellas, and two outdoor dining setups
                </li>
                <li>
                  2500 m² property with native plants left in their natural
                  state
                </li>
                <li>Private parking and easy access to trails</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="section" id="surroundings">
        <div className="content-width">
          <div className="section-header">
            <p className="eyebrow">The land</p>
            <h2>Between the Atlantic and Cumbre Vieja</h2>
            <p className="lead">
              Casa Atlante sits in the peaceful Jedey area, part of the Red
              Natura 2000 of Tamanca. Hiking paths begin at the doorstep, and
              beaches, villages, and lava fields are a short drive away.
            </p>
          </div>

          <div className="story-grid">
            <article className="story-card">
              <div className="image-frame aspect-16-10">
                <Image
                  src="/gallery/cumbre-vieja-natural-park.jpg"
                  alt="Cumbre Vieja Natural Park landscape"
                  fill
                  sizes="(max-width: 900px) 100vw, 32vw"
                  className="media-fill"
                />
              </div>
              <h3>Trails at your doorstep</h3>
              <p>
                Wander through the Cumbre Vieja Natural Park and Tamanca&apos;s
                protected landscape straight from the house. The area is a sea
                of tranquility, with vistas in every direction.
              </p>
            </article>
            <article className="story-card">
              <div className="image-frame aspect-16-10">
                <Image
                  src="/carousel/sunset-on-ocean-view.jpg"
                  alt="Atlantic ocean view from Casa Atlante"
                  fill
                  sizes="(max-width: 900px) 100vw, 32vw"
                  className="media-fill"
                />
              </div>
              <h3>Beaches and ocean</h3>
              <p>
                Puerto Naos and Charco Verde beaches are around 15 minutes away
                by car, Puerto de Tazacorte 25 minutes, and the wild beaches of
                Fuencaliente around 30 minutes. The terrace faces the Atlantic
                for golden sunsets.
              </p>
            </article>
            <article className="story-card">
              <div className="image-frame aspect-16-10">
                <Image
                  src="/carousel/los-llanos-de-aridane.jpg"
                  alt="Lava field near Casa Atlante"
                  fill
                  sizes="(max-width: 900px) 100vw, 32vw"
                  className="media-fill"
                />
              </div>
              <h3>Nearby essentials</h3>
              <p>
                El Paso and Los Llanos are 20 minutes by car. Fuencaliente's
                supermarkets are 15 minutes away, and a local shop one minute
                from the house covers daily needs.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section muted" id="gallery">
        <div className="content-width">
          <div className="section-header">
            <p className="eyebrow">Gallery</p>
            <h2>Casa Atlante in pictures</h2>
            <p className="lead">
              The shutters, mosquito nets, and curtains were added after some of
              these photos were taken. Every room is prepared for privacy,
              comfort, and soft light.
            </p>
          </div>

          <div className="gallery-grid">
            {galleryImages.map((src) => (
              <div
                key={src}
                className="gallery-card"
                onClick={() => setSelectedImage(src)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setSelectedImage(src)}
              >
                <Image
                  src={src}
                  alt={getAlt(src)}
                  fill
                  sizes="(max-width: 768px) 100vw, 30vw"
                  className="media-fill"
                />
              </div>
            ))}
          </div>

          <div className="hero-actions" style={{ marginTop: "22px" }}>
            <Link className="btn secondary" href="/gallery">
              View full gallery
            </Link>
          </div>
        </div>
      </section>

      <section className="section" id="press">
        <div className="content-width">
          <div className="section-header">
            <p className="eyebrow">What guests notice</p>
            <h2>Full of light, calm, and connected to nature</h2>
            <p className="lead">
              Casa Atlante blends ocean horizon views with thoughtful finishes.
              It&apos;s a place to slow down, work with a view, and share long
              meals outdoors.
            </p>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <h3>Uninterrupted sunsets</h3>
              <p>
                West-facing terraces catch the sun all day and turn golden each
                evening, perfect for lingering dinners or stargazing.
              </p>
            </article>
            <article className="feature-card">
              <h3>Made with care</h3>
              <p>
                Much of the furniture is handcrafted from reclaimed wood, giving
                the house a warm, personal feel.
              </p>
            </article>
            <article className="feature-card">
              <h3>Quiet, but connected</h3>
              <p>
                Fast internet, dedicated work-friendly spots, and the silence of
                Jedey's landscape make it easy to rest or focus.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section muted" id="to-do">
        <div className="content-width">
          <div className="section-header">
            <p className="eyebrow">To do in the area</p>
            <h2>Explore La Palma&apos;s west coast</h2>
            <p className="lead">
              Ocean swims, volcanic trails, and small-town eateries are all
              close by. A few favorites to start planning:
            </p>
          </div>

          <div className="list-grid">
            <article>
              <h3>Restaurants</h3>
              <p>
                La Palma has a deep bench of good restaurants. Nearby favorites
                include Bodegón Tamanca and Restaurante El Secadero for local
                recipes, plus El Trébol and La Taberna del Puerto in Puerto de
                Tazacorte when you want seafood.
              </p>
            </article>
            <article>
              <h3>Beaches</h3>
              <p>
                Playa Puerto Naos and El Charco Verde are around 15 minutes
                away, with El Remo just beyond. Puerto de Tazacorte mixes sandy
                shores and restaurants, while the Fuencaliente coast hides Playa
                Zamora (Chica and Grande) and Playa de Echentive near the
                lighthouse and salt pans.
              </p>
            </article>
            <article>
              <h3>Volcanoes</h3>
              <p>
                Casa Atlante sits atop the 1585 Tihuya lava field overlooking El
                Canalizo and the 1712 El Charco flows to the south. Tajogaite
                (2021) is 5 minutes away, right beside the Caños de Fuego
                interpretation centre and San Juan volcanic caves. Fuencaliente
                (15 minutes) adds Teneguía (1971) to the list.
              </p>
              <p>Hike the 17.5 km Ruta de Los Volcanes through Cumbre Vieja</p>
            </article>
            <article>
              <h3>The stars</h3>
              <p>
                Skies stay amazingly clear. Stargaze right from Casa Atlante, or
                drive up to El Roque de Los Muchachos for observatories. A
                closer option is the Mirador Astronómico del Llano del Jable,
                about 45 minutes away.
              </p>
            </article>
            <article>
              <h3>The North</h3>
              <p>
                La Palma changes character up north. Explore El Cubo de la Galga
                and Los Tilos for laurel forests and shaded hikes.
              </p>
            </article>
            <article>
              <h3>La Caldera de Taburiente</h3>
              <p>A national-park jewel best enjoyed by camping overnight.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section" id="booking">
        <div className="content-width split-grid">
          <div>
            <div className="section-header">
              <p className="eyebrow">Booking</p>
              <h2>Ready to stay at Casa Atlante?</h2>
              <p className="lead">
                Send us your dates and the number of guests. We&apos;ll confirm
                availability and share all arrival details.
              </p>
            </div>

            <div className="booking-card">
              <p>
                Rates: 90 € per night for two guests. 20 € per night for each
                additional guest (up to 4).
              </p>
              <p>Check-in from 15:00; check-out by 10:00.</p>
              <div className="hero-actions">
                <Link className="btn secondary" href="/booking">
                  Check availability
                </Link>
              </div>
            </div>
          </div>

          <div>
            <div className="section-header" style={{ marginBottom: "18px" }}>
              <p className="eyebrow">Location</p>
              <h2>Jedey, La Palma</h2>
              <p className="lead">
                A quiet spot with easy drives to El Paso and Los Llanos (30-45
                minutes), Fuencaliente (15 minutes), and the west coast beaches.
              </p>
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
        </div>
      </section>

      {selectedImage && (
        <div className="lightbox" role="dialog" aria-modal="true">
          <button onClick={() => setSelectedImage(null)} aria-label="Close">
            Close
          </button>
          <img src={selectedImage} alt={getAlt(selectedImage)} />
        </div>
      )}
    </>
  );
}
