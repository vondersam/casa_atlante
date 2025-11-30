'use client';

import Image from 'next/image';
import { useState } from 'react';
import getAlt from '../helpers/getAlt';

const filenames = [
  '/gallery/bathroom-with-mountain-views.jpg',
  '/gallery/bathroom-with-washing-machine.jpg',
  '/gallery/bathroom.jpg',
  '/gallery/casa-atlante-front.jpg',
  '/gallery/cumbre-vieja-natural-park.jpg',
  '/gallery/front-house-terrace-table.jpg',
  '/gallery/front-house-terrace.jpg',
  '/gallery/house-front-entrance.jpg',
  '/gallery/house-main-entrance-with-sunset.jpg',
  '/gallery/house-roof-with-solar-panels.jpg',
  '/gallery/kitchen-and-living-room.jpg',
  '/gallery/lava-field.jpg',
  '/gallery/main-room-ocean-view.jpg',
  '/gallery/main-room-queen-bed.jpg',
  '/gallery/mountain-view.jpg',
  '/gallery/ocean-view-from-terrace.jpg',
  '/gallery/ocean-view-hierro.jpg',
  '/gallery/ocean-view-with-outdoor-table.jpg',
  '/gallery/open-space-kitchen.jpg',
  '/gallery/puerto-naos-view.jpg',
  '/gallery/second-room-two-beds.jpg',
  '/gallery/second-room-with-wardrobe.jpg',
  '/gallery/sunbeds-on-terrace.jpg',
  '/gallery/terrace-with-outdoor-table.jpg',
  '/gallery/view-from-kitchen.jpg',
  '/gallery/view-from-living-room.jpg',
  '/gallery/living-room-sun.jpeg',
  '/gallery/bathroom-with-shower.jpg',
  '/gallery/living-room.jpg',
  '/gallery/sunset-from-second-terrace.jpg',
  '/gallery/afternoon-terrace.jpg',
  '/gallery/aenium-bejeque.jpeg',
  '/gallery/casa-atlante-name.jpeg',
  '/gallery/gr-130-jedey.jpeg',
  '/gallery/ruta-de-los-volcanes.jpeg',
  '/gallery/stargazing.jpeg'
];

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <section className="section">
      <div className="content-width">
        <div className="section-header">
          <p className="eyebrow">Gallery</p>
          <h1>Casa Atlante in detail</h1>
          <p className="lead">
            The shutters, mosquito nets, and curtains were installed after some
            photos were taken. Every room is prepared for privacy and soft
            light.
          </p>
        </div>

        <div className="gallery-grid">
          {filenames.map((filename) => (
            <div
              key={filename}
              className="gallery-card"
              onClick={() => setSelectedImage(filename)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedImage(filename)}
            >
              <Image
                src={filename}
                alt={getAlt(filename)}
                fill
                sizes="(max-width: 768px) 100vw, 30vw"
                className="media-fill"
              />
            </div>
          ))}
        </div>
      </div>

      {selectedImage && (
        <div className="lightbox" role="dialog" aria-modal="true">
          <button onClick={() => setSelectedImage(null)} aria-label="Close">
            Close
          </button>
          <img src={selectedImage} alt={getAlt(selectedImage)} />
        </div>
      )}
    </section>
  );
}
