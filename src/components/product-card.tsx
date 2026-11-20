
"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ArrowUpRight } from "lucide-react";
import { useEffect, useState, type PointerEvent } from "react";
import {
  m,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { staggerItem, quickTransition } from "@/animations/variants";
import { MotionButton } from "@/components/motion-button";
import type { Product } from "@/data/catalog";
import { currencyLabel } from "@/data/catalog";
import {
  FAVORITES_EVENT,
  readFavorites,
  toggleFavorite,
} from "@/lib/shop-storage";

export function ProductCard({ product }: { product: Product }) {
  const [saved, setSaved] = useState(false);
  const [favoriteError, setFavoriteError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const reduceMotion = useReducedMotion();
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rotateX = useSpring(rawRotateX, { stiffness: 190, damping: 22, mass: 0.25 });
  const rotateY = useSpring(rawRotateY, { stiffness: 190, damping: 22, mass: 0.25 });

  useEffect(() => {
    const sync = () => setSaved(readFavorites().includes(product.id));
    sync();
    window.addEventListener(FAVORITES_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FAVORITES_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [product.id]);

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (reduceMotion || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const relativeX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const relativeY = (event.clientY - bounds.top) / bounds.height - 0.5;
    rawRotateY.set(relativeX * 5);
    rawRotateX.set(relativeY * -4);
  }

  function resetTilt() {
    rawRotateX.set(0);
    rawRotateY.set(0);
  }

  function onToggleFavorite() {
    try {
      setSaved(toggleFavorite(product.id).includes(product.id));
      setFavoriteError("");
    } catch (error) {
      setFavoriteError(error instanceof Error ? error.message : "Could not save this favorite.");
    }
  }

  return (
    <m.article
      className="product-card glass-surface glass-surface--interactive"
      data-cursor="VIEW"
      initial={reduceMotion ? false : "hidden"}
      whileInView={reduceMotion ? undefined : "visible"}
      viewport={{ once: true, amount: 0.12 }}
      variants={reduceMotion ? undefined : staggerItem}
      whileHover={reduceMotion ? undefined : { y: -3 }}
      transition={quickTransition}
      style={
        reduceMotion
          ? undefined
          : { rotateX, rotateY, transformPerspective: 900, transformStyle: "preserve-3d" }
      }
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
    >
      <Link
        href={`/shop/${product.slug}`}
        className="product-image glass-inset"
        aria-label={`View ${product.title}`}
        data-cursor="VIEW"
      >
        {product.image && !imageFailed ? (
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="(max-width: 700px) 50vw, (max-width: 1100px) 33vw, 25vw"
            className="object-contain"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="product-placeholder">ORIGINAL<br />ARTWORK</span>
        )}
        <span className="image-open"><ArrowUpRight size={18} /></span>
      </Link>
      <MotionButton
        type="button"
        data-cursor="SAVE"
        className={`wishlist-btn ${saved ? "saved" : ""}`}
        aria-label={saved ? `Remove ${product.title} from favorites` : `Add ${product.title} to favorites`}
        aria-pressed={saved}
        onClick={onToggleFavorite}
      >
        <m.span
          animate={saved && !reduceMotion ? { scale: [1, 1.22, 1] } : { scale: 1 }}
          transition={{ duration: 0.26 }}
        >
          <Heart size={17} fill={saved ? "currentColor" : "none"} />
        </m.span>
      </MotionButton>
      <Link
        href={`/shop/${product.slug}`}
        className="product-info product-info-link"
        aria-label={`View ${product.title} details`}
      >
        <div><h3>{product.title}</h3><p>{product.category}</p></div>
        <strong>{currencyLabel(product.price, product.currency)}</strong>
      </Link>
      {favoriteError && <p className="storage-error" role="status">{favoriteError}</p>}
    </m.article>
  );
}
