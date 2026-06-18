"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface HeroSlideshowProps {
  children: React.ReactNode;
}

const IMAGES = [
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=2200&q=90", // Dark Camaro
  "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=2200&q=90", // Porsche 911 GT3 (Yellow/Green)
  "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=2200&q=90", // Audi e-tron GT (Blue)
  "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=2200&q=90", // Mercedes-AMG GT (Dark Silver)
];

export function HeroSlideshow({ children }: HeroSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden bg-[#080c11] text-white">
      {/* Background Images with cross-fade */}
      <div className="absolute inset-0">
        {IMAGES.map((src, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={src}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-60" : "opacity-0 pointer-events-none"
              }`}
            >
              <Image
                src={src}
                alt={`TQ Auto showroom hero ${index + 1}`}
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover"
              />
            </div>
          );
        })}
      </div>

      {/* Modern gradient overlay for high contrast text readability and bright car view */}
      {/* <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(227,24,55,0.2),transparent_35%),linear-gradient(120deg,#070b10_0%,rgba(7,11,16,0.92)_45%,rgba(7,11,16,0.4)_100%)]" /> */}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </section>
  );
}
