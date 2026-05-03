'use client';

import Image from 'next/image';
import { useState } from 'react';
import ImageLightbox from '@/app/components/image-lightbox';
import getAlt from '@/app/helpers/getAlt';

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
          <p className="eyebrow">Galería</p>
          <h1>Casa Atlante en detalle</h1>
          <p className="lead">
            Las contraventanas, mosquiteras y cortinas se instalaron después de
            tomar algunas fotos. Cada habitación está preparada para ofrecer
            privacidad y una luz suave.
          </p>
        </div>

        <div className="gallery-grid">
          {filenames.map((filename) => {
            const description = getAlt(filename, 'es');

            return (
              <div
                key={filename}
                className="gallery-card"
                onClick={() => setSelectedImage(filename)}
                role="button"
                tabIndex={0}
                aria-label={description}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' && e.key !== ' ') return;

                  e.preventDefault();
                  setSelectedImage(filename);
                }}
              >
                <Image
                  src={filename}
                  alt={description}
                  fill
                  sizes="(max-width: 768px) 100vw, 30vw"
                  className="media-fill"
                />
              </div>
            );
          })}
        </div>
      </div>

      <ImageLightbox
        images={filenames}
        selectedImage={selectedImage}
        onSelect={setSelectedImage}
        onClose={() => setSelectedImage(null)}
        closeLabel="Cerrar"
        locale="es"
      />
    </section>
  );
}
