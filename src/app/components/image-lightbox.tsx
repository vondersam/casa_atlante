'use client';

import { useCallback, useEffect } from 'react';
import getAlt from '@/app/helpers/getAlt';

type ImageLightboxProps = {
  images: readonly string[];
  selectedImage: string | null;
  onSelect: (image: string) => void;
  onClose: () => void;
  closeLabel: string;
  locale?: 'en' | 'es';
};

export default function ImageLightbox({
  images,
  selectedImage,
  onSelect,
  onClose,
  closeLabel,
  locale = 'en'
}: ImageLightboxProps) {
  const selectAdjacentImage = useCallback(
    (direction: -1 | 1) => {
      if (!selectedImage || images.length === 0) return;

      const currentIndex = images.indexOf(selectedImage);
      if (currentIndex === -1) return;

      const nextIndex = (currentIndex + direction + images.length) % images.length;
      onSelect(images[nextIndex]);
    },
    [images, onSelect, selectedImage]
  );

  useEffect(() => {
    if (!selectedImage) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Esc') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

      event.preventDefault();
      selectAdjacentImage(event.key === 'ArrowRight' ? 1 : -1);
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, selectAdjacentImage, selectedImage]);

  if (!selectedImage) return null;

  const description = getAlt(selectedImage, locale);
  const previousLabel = locale === 'es' ? 'Imagen anterior' : 'Previous image';
  const nextLabel = locale === 'es' ? 'Imagen siguiente' : 'Next image';
  const showNavigation = images.length > 1;

  return (
    <div className="lightbox" role="dialog" aria-modal="true">
      <button className="lightbox-close" onClick={onClose} aria-label={closeLabel}>
        {closeLabel}
      </button>
      {showNavigation && (
        <>
          <button
            className="lightbox-nav previous"
            type="button"
            onClick={() => selectAdjacentImage(-1)}
            aria-label={previousLabel}
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            className="lightbox-nav next"
            type="button"
            onClick={() => selectAdjacentImage(1)}
            aria-label={nextLabel}
          >
            <span aria-hidden="true">→</span>
          </button>
        </>
      )}
      <figure className="lightbox-content">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={selectedImage} alt={description} />
        <figcaption>{description}</figcaption>
      </figure>
    </div>
  );
}
