'use client';

import { useEffect } from 'react';
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
  useEffect(() => {
    if (!selectedImage) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Esc') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

      const currentIndex = images.indexOf(selectedImage);
      if (currentIndex === -1 || images.length === 0) return;

      event.preventDefault();

      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const nextIndex = (currentIndex + direction + images.length) % images.length;
      onSelect(images[nextIndex]);
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [images, onClose, onSelect, selectedImage]);

  if (!selectedImage) return null;

  const description = getAlt(selectedImage, locale);

  return (
    <div className="lightbox" role="dialog" aria-modal="true">
      <button onClick={onClose} aria-label={closeLabel}>
        {closeLabel}
      </button>
      <figure className="lightbox-content">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={selectedImage} alt={description} />
        <figcaption>{description}</figcaption>
      </figure>
    </div>
  );
}
