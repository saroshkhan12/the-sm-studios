"use client";

import Image from "next/image";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { useCallback, useState } from "react";
import { useSwipeNavigation } from "@/hooks/use-swipe-navigation";
import { MotionButton } from "@/components/motion-button";

const galleryImageVariants = {
  enter: (swipeDirection: number) => ({
    opacity: 0,
    x: swipeDirection * 24,
  }),
  center: { opacity: 1, x: 0 },
  exit: (swipeDirection: number) => ({
    opacity: 0,
    x: swipeDirection * -24,
  }),
};

export function ProductGallery({
  title,
  images,
}: {
  title: string;
  images: string[];
}) {
  const [selected, setSelected] = useState(0);
  const [direction, setDirection] = useState(1);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const reduceMotion = useReducedMotion();
  const availableImages = images.filter((src) => !failedImages.includes(src));
  const currentImage = availableImages[selected] || availableImages[0];

  const handleSwipe = useCallback(
    (swipeDirection: "next" | "previous") => {
      if (availableImages.length < 2) return;
      const step = swipeDirection === "next" ? 1 : -1;
      setDirection(step);
      setSelected((current) => (current + step + availableImages.length) % availableImages.length);
    },
    [availableImages.length],
  );
  const swipeHandlers = useSwipeNavigation(handleSwipe);

  function selectImage(index: number) {
    setDirection(index >= selected ? 1 : -1);
    setSelected(index);
  }

  function markFailed(src: string) {
    setFailedImages((failed) =>
      failed.includes(src) ? failed : [...failed, src],
    );
    setSelected(0);
  }

  return (
    <div className="product-gallery">
      <div
        className="gallery-main glass-inset"
        role="group"
        aria-label={`${title} image gallery`}
        aria-roledescription="carousel"
        tabIndex={availableImages.length > 1 ? 0 : undefined}
        {...swipeHandlers}
      >
        {currentImage ? (
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <m.div
              key={currentImage}
              className="gallery-image"
              custom={direction}
              variants={galleryImageVariants}
              initial={reduceMotion ? false : "enter"}
              animate="center"
              exit={reduceMotion ? undefined : "exit"}
              transition={{
                duration: reduceMotion ? 0 : 0.34,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Image
                src={currentImage}
                alt={`${title}, image ${selected + 1}`}
                fill
                sizes="(max-width: 650px) calc(100vw - 40px), (max-width: 860px) calc(100vw - 56px), (max-width: 1480px) 52vw, 720px"
                priority={selected === 0}
                className="object-contain"
                onError={() => markFailed(currentImage)}
              />
            </m.div>
          </AnimatePresence>
        ) : (
          <div className="gallery-fallback" role="img" aria-label={`${title}: no image available`}>
            ORIGINAL<br />ARTWORK
          </div>
        )}
      </div>

      {availableImages.length > 1 && (
        <div className="gallery-thumbnails" aria-label="Product images">
          {availableImages.map((src, index) => (
            <MotionButton
              key={src}
              type="button"
              className={`gallery-thumbnail glass-inset${src === currentImage ? " selected" : ""}`}
              onClick={() => selectImage(index)}
              aria-label={`View image ${index + 1} of ${availableImages.length}`}
              aria-pressed={src === currentImage}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="88px"
                className="object-cover"
                onError={() => markFailed(src)}
              />
            </MotionButton>
          ))}
        </div>
      )}
    </div>
  );
}
