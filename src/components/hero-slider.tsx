"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, MoveUpRight } from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useSwipeNavigation } from "@/hooks/use-swipe-navigation";
import { InteractiveHeroImage } from "@/components/interactive-hero-image";
import { MagneticLink } from "@/components/magnetic-link";

export type HeroSlide = {
  id: string;
  eyebrow: string;
  firstLine: string;
  firstAccent: string;
  secondLine: string;
  secondAccent: string;
  description: string;
  image?: string;
  alt: string;
  caption: string;
  href: string;
};

const fallbackSlide: HeroSlide = {
  id: "studio",
  eyebrow: "INDEPENDENT CREATIVE STUDIO",
  firstLine: "Art that",
  firstAccent: "speaks.",
  secondLine: "Design that",
  secondAccent: "connects.",
  description:
    "Meaningful artwork, expressive designs, and creative pieces inspired by culture, identity, and imagination.",
  alt: "",
  caption: "ART · CULTURE · EXPRESSION",
  href: "/shop",
};

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplayPaused, setAutoplayPaused] = useState(false);
  const availableSlides = slides.length ? slides : [fallbackSlide];
  const slideCount = availableSlides.length;
  const slide = availableSlides[activeIndex] ?? availableSlides[0];
  const slideTransition = {
    duration: reduceMotion ? 0 : 0.42,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  useEffect(() => {
    if (reduceMotion !== false || autoplayPaused || slideCount < 2) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slideCount);
    }, 7500);

    return () => window.clearInterval(timer);
  }, [autoplayPaused, reduceMotion, slideCount]);

  function showSlide(index: number) {
    setAutoplayPaused(true);
    setActiveIndex((index + slideCount) % slideCount);
  }

  const swipeHandlers = useSwipeNavigation((direction) => {
    showSlide(activeIndex + (direction === "next" ? 1 : -1));
  });

  return (
    <section
      className="hero"
      aria-label="Featured artwork"
      aria-roledescription="carousel"
      tabIndex={0}
      {...swipeHandlers}
      onPointerEnter={() => setAutoplayPaused(true)}
      onFocusCapture={() => setAutoplayPaused(true)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={`copy-${slide.id}`}
          className="hero-copy"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
          transition={slideTransition}
          role="group"
          aria-live="off"
          aria-roledescription="slide"
          aria-label={`${activeIndex + 1} of ${slideCount}`}
        >
          <span className="eyebrow light">{slide.eyebrow}</span>
          <h1>
            <span>
              {slide.firstLine} <em>{slide.firstAccent}</em>
            </span>
            <br />
            <span>
              {slide.secondLine} <em>{slide.secondAccent}</em>
            </span>
          </h1>
          <p>{slide.description}</p>
          <div className="hero-buttons">
            <MagneticLink
              className="btn btn-light"
              href={slide.href}
              data-cursor="SHOP"
            >
              EXPLORE THE COLLECTION <MoveUpRight size={16} aria-hidden="true" />
            </MagneticLink>
            <Link className="text-link light-link" href="/about">
              OUR CREATIVE STORY <MoveUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </m.div>
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={`art-${slide.id}`}
          className="hero-art-reveal"
          initial={reduceMotion ? false : { opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, x: -10 }}
          transition={slideTransition}
        >
          <InteractiveHeroImage
            src={slide.image}
            alt={slide.alt}
            caption={slide.caption}
            currentSlide={activeIndex + 1}
            totalSlides={slideCount}
          />
        </m.div>
      </AnimatePresence>

      <div className="hero-bottom">
        <div className="hero-pagination">
          <span className="hero-page-current">
            {String(activeIndex + 1).padStart(2, "0")}
          </span>
          <span className="hero-page-divider" aria-hidden="true">/</span>
          <span className="hero-page-total">
            {String(slideCount).padStart(2, "0")}
          </span>
          <div className="hero-pagination-dots" role="group" aria-label="Choose a slide">
            {availableSlides.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={index === activeIndex ? "active" : ""}
                aria-label={`Go to slide ${index + 1}: ${item.eyebrow}`}
                aria-pressed={index === activeIndex}
                onClick={() => showSlide(index)}
              >
                <span />
              </button>
            ))}
          </div>
        </div>
        <div className="hero-controls" role="group" aria-label="Slide controls">
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => showSlide(activeIndex - 1)}
            disabled={slideCount < 2}
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => showSlide(activeIndex + 1)}
            disabled={slideCount < 2}
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
