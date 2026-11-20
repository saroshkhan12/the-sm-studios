"use client";

import Image from "next/image";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { MotionButton } from "@/components/motion-button";

export function ProductGallery({
  title,
  images,
}: {
  title: string;
  images: string[];
}) {
  const [selected, setSelected] = useState(0);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const reduceMotion = useReducedMotion();
  const availableImages = images.filter((src) => !failedImages.includes(src));
  const currentImage = availableImages[selected] || availableImages[0];

  function markFailed(src: string) {
    setFailedImages((failed) =>
      failed.includes(src) ? failed : [...failed, src],
    );
    setSelected(0);
  }

  return (
    <div className="product-gallery">
      <div className="gallery-main glass-inset">
        {currentImage ? (
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={currentImage}
              className="gallery-image"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.22 }}
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
              onClick={() => setSelected(index)}
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
