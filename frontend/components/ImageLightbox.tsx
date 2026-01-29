'use client';

import { X, Download } from 'lucide-react';
import { useEffect } from 'react';

interface ImageLightboxProps {
  imageUrl: string;
  imageName: string;
  onClose: () => void;
}

export default function ImageLightbox({ imageUrl, imageName, onClose }: ImageLightboxProps) {
  // Chiudi con ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = imageName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
      >
        <X size={24} />
      </button>

      {/* Image container */}
      <div
        className="flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={imageName}
          className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg"
        />

        {/* Footer with name and download */}
        <div className="flex items-center gap-4 text-white">
          <span className="text-sm text-white/70">{imageName}</span>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition-colors"
          >
            <Download size={14} />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
