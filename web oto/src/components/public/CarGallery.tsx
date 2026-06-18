"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

interface CarGalleryProps {
  mainImage: string;
  gallery: string[];
  alt: string;
}

export function CarGallery({ mainImage, gallery = [], alt }: CarGalleryProps) {
  const locale = useLocale();
  
  // Localized strings
  const isVi = locale === "vi";
  const zoomTooltip = isVi ? "Bấm để phóng to" : "Click to enlarge";
  const closeText = isVi ? "Đóng" : "Close";
  const prevText = isVi ? "Ảnh trước" : "Previous";
  const nextText = isVi ? "Ảnh sau" : "Next";

  // Combine main image and gallery images
  const allImages = [mainImage, ...gallery];
  
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsOpen(true);
  };

  const closeLightbox = useCallback(() => {
    setIsOpen(false);
  }, []);

  const nextImage = useCallback(() => {
    setLightboxIndex((prev) => (prev + 1) % allImages.length);
  }, [allImages.length]);

  const prevImage = useCallback(() => {
    setLightboxIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  }, [allImages.length]);

  // Handle keyboard navigation in Lightbox
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        nextImage();
      } else if (e.key === "ArrowLeft") {
        prevImage();
      } else if (e.key === "Escape") {
        closeLightbox();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, nextImage, prevImage, closeLightbox]);

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* Main Big Image Area */}
      <div 
        onClick={() => openLightbox(activeIndex)}
        className="group relative aspect-[16/10] overflow-hidden rounded-xl border theme-border bg-[var(--muted)] cursor-zoom-in transition-all duration-300 select-none"
      >
        <Image
          src={allImages[activeIndex]}
          alt={alt}
          fill
          priority
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.015]"
        />
        
        {/* Zoom Overlay on Hover */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md text-white shadow-2xl scale-95 group-hover:scale-100 transition-all duration-300">
            <Maximize2 className="text-[#e31837]" size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">{zoomTooltip}</span>
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Thumbnails List */}
      {allImages.length > 1 && (
        <div className="relative w-full group/thumbs flex items-center">
          {/* Scroll Left Button */}
          <button
            onClick={() => {
              thumbnailsRef.current?.scrollBy({ left: -150, behavior: "smooth" });
            }}
            className="absolute left-1 z-10 p-1.5 rounded-full bg-black/70 hover:bg-black/90 border border-white/10 text-white/80 hover:text-white transition-all shadow-md active:scale-95 opacity-0 group-hover/thumbs:opacity-100 duration-200"
            aria-label={prevText}
          >
            <ChevronLeft size={14} />
          </button>

          {/* Scrollable container */}
          <div 
            ref={thumbnailsRef}
            className="flex gap-2.5 overflow-x-auto scroll-smooth scrollbar-none w-full min-w-0 px-8"
          >
            {allImages.map((image, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={`${image}-${index}`}
                  onClick={() => setActiveIndex(index)}
                  className={`relative aspect-[16/10] w-20 sm:w-24 shrink-0 overflow-hidden rounded-lg border transition-all duration-200 bg-[var(--muted)] group ${
                    isActive 
                      ? "border-[#e31837] ring-2 ring-[#e31837]/35 scale-[0.98]" 
                      : "border-white/10 hover:border-white/30 hover:scale-[1.02]"
                  }`}
                  aria-label={`View image ${index + 1}`}
                >
                  <Image 
                    src={image} 
                    alt={`${alt} - Thumbnail ${index + 1}`} 
                    fill 
                    sizes="120px" 
                    className={`object-cover transition-opacity duration-300 ${
                      isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"
                    }`} 
                  />
                </button>
              );
            })}
          </div>

          {/* Scroll Right Button */}
          <button
            onClick={() => {
              thumbnailsRef.current?.scrollBy({ left: 150, behavior: "smooth" });
            }}
            className="absolute right-1 z-10 p-1.5 rounded-full bg-black/70 hover:bg-black/90 border border-white/10 text-white/80 hover:text-white transition-all shadow-md active:scale-95 opacity-0 group-hover/thumbs:opacity-100 duration-200"
            aria-label={nextText}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Lightbox Modal (Centered Dialog Box) */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md select-none p-4 transition-opacity duration-300"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={closeLightbox} />

          {/* Dialog Card Container */}
          <div className="relative w-full max-w-4xl bg-[#11161d] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col z-[105] animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#151a22]">
              <h3 className="font-semibold text-base text-[#f7f7f7] truncate pr-4">{alt}</h3>
              <button 
                onClick={closeLightbox}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                aria-label={closeText}
              >
                <X size={20} />
              </button>
            </div>

            {/* Main Image Viewport */}
            <div className="relative aspect-[16/10] w-full bg-black/10 flex items-center justify-center">
              <div className="relative w-full h-full max-h-[60vh] flex items-center justify-center p-4">
                <Image
                  src={allImages[lightboxIndex]}
                  alt={`${alt} - Image ${lightboxIndex + 1}`}
                  fill
                  priority
                  sizes="(min-width: 1024px) 70vw, 90vw"
                  className="object-contain"
                />
              </div>

              {/* Navigation Controls */}
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-[110] p-2.5 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 text-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
                aria-label={prevText}
              >
                <ChevronLeft size={20} />
              </button>

              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-[110] p-2.5 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 text-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
                aria-label={nextText}
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Footer with Thumbnails */}
            <div className="px-5 py-3 border-t border-white/10 bg-[#151a22] flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
              <span className="text-zinc-400 font-bold shrink-0">{lightboxIndex + 1} / {allImages.length}</span>
              
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto max-w-full pb-1 scrollbar-none">
                  {allImages.map((image, index) => {
                    const isSelected = index === lightboxIndex;
                    return (
                      <button
                        key={`lightbox-thumb-${index}`}
                        onClick={() => setLightboxIndex(index)}
                        className={`relative w-12 h-8 shrink-0 overflow-hidden rounded border transition-all duration-200 bg-zinc-950 ${
                          isSelected 
                            ? "border-[#e31837] ring-2 ring-[#e31837]/35 scale-95" 
                            : "border-white/5 opacity-50 hover:opacity-100"
                        }`}
                      >
                        <Image src={image} alt="" fill sizes="50px" className="object-cover" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
