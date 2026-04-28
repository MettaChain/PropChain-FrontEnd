'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ImageLightbox } from './ImageLightbox';

interface ImageGalleryProps {
  images: string[];
  propertyName: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ 
  images, 
  propertyName 
}) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  if (!images || images.length === 0) {
    return (
      <div className="relative rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 h-[400px] flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">No images available</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <div className="relative rounded-xl overflow-hidden cursor-pointer group">
          <Image
            src={images[0]}
            alt={propertyName}
            width={800}
            height={600}
            className="w-full h-[400px] object-cover transition-transform duration-300 group-hover:scale-105"
            onClick={() => openLightbox(0)}
          />
          
          {/* Overlay with image count */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg">
              <p className="text-gray-900 font-medium">Click to view all {images.length} images</p>
            </div>
          </div>
        </div>

        {/* Thumbnail Gallery */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {images.slice(1, 5).map((image, index) => {
              const actualIndex = index + 1;
              return (
                <div 
                  key={actualIndex} 
                  className="relative rounded-lg overflow-hidden cursor-pointer group"
                  onClick={() => openLightbox(actualIndex)}
                >
                  <Image
                    src={image}
                    alt={`${propertyName} - Image ${actualIndex + 1}`}
                    width={200}
                    height={150}
                    className="w-full h-24 object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              );
            })}
            
            {/* Show more indicator if there are more than 5 images */}
            {images.length > 5 && (
              <div className="relative rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center cursor-pointer group">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-1">
                    +{images.length - 5}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    more
                  </div>
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <ImageLightbox
        images={images}
        initialIndex={lightboxIndex || 0}
        isOpen={lightboxIndex !== null}
        onClose={closeLightbox}
      />
    </>
  );
};
