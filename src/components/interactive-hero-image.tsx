"use client";

import Image from "next/image";
import {
  AnimatePresence,
  m,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef, type PointerEvent } from "react";

export function InteractiveHeroImage({
  src,
  alt,
  caption,
  currentSlide,
  totalSlides,
}: {
  src?: string;
  alt: string;
  caption: string;
  currentSlide: number;
  totalSlides: number;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: frameRef,
    offset: ["start end", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], reduceMotion ? [1, 1] : [1.035, 1]);

  function moveSpotlight(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--spot-x",
      `${((event.clientX - bounds.left) / bounds.width) * 100}%`,
    );
    event.currentTarget.style.setProperty(
      "--spot-y",
      `${((event.clientY - bounds.top) / bounds.height) * 100}%`,
    );
  }

  function resetSpotlight(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.style.setProperty("--spot-x", "50%");
    event.currentTarget.style.setProperty("--spot-y", "50%");
  }

  return (
    <div className="hero-art">
      <m.div
        ref={frameRef}
        className="hero-art-inner"
        data-cursor="EXPLORE"
        onPointerMove={moveSpotlight}
        onPointerLeave={resetSpotlight}
      >
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={src || "studio-artwork"}
            className="hero-art-image-motion"
            style={{ scale }}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.38 }}
          >
            {src ? (
              <Image
                src={src}
                alt={alt}
                fill
                priority={currentSlide === 1}
                sizes="(max-width: 700px) 88vw, (max-width: 1100px) 48vw, 40vw"
                className="hero-art-photo"
              />
            ) : (
              <div className="hero-art-fallback" aria-label="THE SM STUDIOS">
                <Image
                  src="/images/sm-studios-logo-dark.png"
                  alt=""
                  width={380}
                  height={260}
                  priority
                />
              </div>
            )}
          </m.div>
        </AnimatePresence>
        <span className="hero-art-shade" aria-hidden="true" />
        <span className="hero-art-spotlight" aria-hidden="true" />
        <span className="hero-art-frame" aria-hidden="true" />
        <span className="hero-side-note">{caption}</span>
        <span className="hero-art-foot">{alt || "ART · CULTURE · EXPRESSION"}</span>
        <span className="hero-index" aria-hidden="true">
          {String(currentSlide).padStart(2, "0")} / {String(totalSlides).padStart(2, "0")}
        </span>
      </m.div>
    </div>
  );
}
