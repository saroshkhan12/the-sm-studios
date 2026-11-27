"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";

export type ArtworkStackItem = {
  id: string;
  title: string;
  subtitle: string;
  image?: string;
  href: string;
  eyebrow: string;
  detail?: string;
};

export function ArtworkCardStack({
  items,
  label,
  heading,
}: {
  items: ArtworkStackItem[];
  label: string;
  heading: string;
}) {
  const [active, setActive] = useState(0);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const suppressClick = useRef(false);
  const reduceMotion = useReducedMotion();
  const count = items.length;

  const move = useCallback((direction: number) => {
    if (count < 2) return;
    setActive((current) => (current + direction + count) % count);
  }, [count]);

  useEffect(() => {
    setActive((current) => (count ? current % count : 0));
  }, [count]);

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    }
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    setDragStart(event.clientX);
    suppressClick.current = false;
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (dragStart === null) return;
    const delta = event.clientX - dragStart;
    if (Math.abs(delta) > 42) {
      suppressClick.current = true;
      move(delta < 0 ? 1 : -1);
    }
    setDragStart(null);
  }

  if (!count) return null;

  return (
    <section className="artwork-stack-section" aria-label={label}>
      <div className="artwork-stack-heading">
        <div><span className="eyebrow">A CLOSER LOOK</span><h2>{heading}</h2></div>
        <p>Move through the studio, one piece at a time.</p>
      </div>

      <div
        className="artwork-stack-stage"
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setDragStart(null)}
        onPointerLeave={() => setDragStart(null)}
      >
        <div className="artwork-stack-orbit artwork-stack-orbit-one" aria-hidden="true" />
        <div className="artwork-stack-orbit artwork-stack-orbit-two" aria-hidden="true" />
        {items.map((item, index) => {
          let offset = index - active;
          if (offset > count / 2) offset -= count;
          if (offset < -count / 2) offset += count;
          const visible = Math.abs(offset) <= 2;
          return (
            <article
              key={item.id}
              className={`artwork-stack-card${offset === 0 ? " is-active" : ""}`}
              data-position={offset}
              aria-hidden={!visible}
              style={{
                transform: `translate3d(${offset * 64}px, ${Math.abs(offset) * 13}px, 0) rotate(${offset * 5}deg) scale(${offset === 0 ? 1 : Math.max(0.78, 1 - Math.abs(offset) * 0.085)})`,
                zIndex: 10 - Math.abs(offset),
                opacity: visible ? (offset === 0 ? 1 : Math.max(0.22, 0.68 - Math.abs(offset) * 0.2)) : 0,
                transition: reduceMotion ? "none" : "transform 560ms cubic-bezier(.2,.75,.2,1), opacity 420ms ease",
                pointerEvents: offset === 0 ? "auto" : "none",
              }}
            >
              <Link
                href={item.href}
                className="artwork-stack-card-link"
                tabIndex={offset === 0 ? 0 : -1}
                onClick={(event) => {
                  if (suppressClick.current) {
                    event.preventDefault();
                    suppressClick.current = false;
                  }
                }}
                draggable={false}
              >
                <div className="artwork-stack-image">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      priority={index === active}
                      sizes="(max-width: 700px) 78vw, 420px"
                      draggable={false}
                    />
                  ) : (
                    <div className="artwork-stack-fallback" aria-hidden="true">
                      <span>{item.eyebrow}</span>
                      <i>{item.title.slice(0, 1)}</i>
                    </div>
                  )}
                  <span className="artwork-stack-image-shade" />
                  <span className="artwork-stack-index">{String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span>
                  <span className="artwork-stack-open"><ArrowUpRight size={18} /></span>
                </div>
                <div className="artwork-stack-copy">
                  <span className="eyebrow">{item.eyebrow}</span>
                  <h3>{item.title}</h3>
                  <p>{item.subtitle}</p>
                  {item.detail ? <small>{item.detail}</small> : null}
                </div>
              </Link>
            </article>
          );
        })}
        <span className="artwork-stack-caption" aria-hidden="true">THE SM STUDIOS · CURATED WITH INTENTION</span>
      </div>

      <div className="artwork-stack-controls">
        <span className="artwork-stack-current" aria-live="polite">
          <strong>{String(active + 1).padStart(2, "0")}</strong>
          <span> / {String(count).padStart(2, "0")}</span>
        </span>
        <div className="artwork-stack-progress" aria-hidden="true">
          {items.map((item, index) => (
            <span key={item.id} className={index === active ? "is-active" : ""} />
          ))}
        </div>
        <div className="artwork-stack-arrows">
          <button type="button" onClick={() => move(-1)} aria-label="Previous artwork"><ArrowLeft size={17} /></button>
          <button type="button" onClick={() => move(1)} aria-label="Next artwork"><ArrowRight size={17} /></button>
        </div>
      </div>
      <p className="artwork-stack-hint">DRAG OR USE THE ARROWS TO EXPLORE</p>
    </section>
  );
}
