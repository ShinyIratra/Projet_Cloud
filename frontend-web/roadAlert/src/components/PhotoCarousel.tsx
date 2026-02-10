import React, { useState } from 'react';
import './PhotoCarousel.css';

interface PhotoCarouselProps {
  photos: string[];
  photoPrincipale?: string;
  onClose: () => void;
}

const PhotoCarousel: React.FC<PhotoCarouselProps> = ({ photos, photoPrincipale, onClose }) => {
  // Combiner photo principale et autres photos
  const allPhotos = photoPrincipale 
    ? [photoPrincipale, ...photos.filter(p => p !== photoPrincipale)]
    : photos;
  
  const [currentIndex, setCurrentIndex] = useState(0);

  if (allPhotos.length === 0) {
    return null;
  }

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? allPhotos.length - 1 : prev - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === allPhotos.length - 1 ? 0 : prev + 1));
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="carousel-overlay" onClick={handleBackdropClick}>
      <div className="carousel-container">
        {/* Bouton fermer */}
        <button className="carousel-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>

        {/* Image principale */}
        <div className="carousel-main">
          <img 
            src={allPhotos[currentIndex]} 
            alt={`Photo ${currentIndex + 1}`}
            className="carousel-image"
          />
        </div>

        {/* Navigation si plusieurs photos */}
        {allPhotos.length > 1 && (
          <>
            <button className="carousel-nav carousel-prev" onClick={goToPrevious}>
              <i className="fas fa-chevron-left"></i>
            </button>
            <button className="carousel-nav carousel-next" onClick={goToNext}>
              <i className="fas fa-chevron-right"></i>
            </button>

            {/* Indicateurs */}
            <div className="carousel-indicators">
              {allPhotos.map((_, index) => (
                <button
                  key={index}
                  className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(index);
                  }}
                />
              ))}
            </div>

            {/* Compteur */}
            <div className="carousel-counter">
              {currentIndex + 1} / {allPhotos.length}
            </div>
          </>
        )}

        {/* Thumbnails */}
        {allPhotos.length > 1 && (
          <div className="carousel-thumbnails">
            {allPhotos.map((photo, index) => (
              <img
                key={index}
                src={photo}
                alt={`Thumbnail ${index + 1}`}
                className={`carousel-thumbnail ${index === currentIndex ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoCarousel;
