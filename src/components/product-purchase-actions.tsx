"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import {
  addToCart,
  FAVORITES_EVENT,
  readFavorites,
  toggleFavorite,
} from "@/lib/shop-storage";
import { MotionButton } from "@/components/motion-button";

export function ProductPurchaseActions({
  product,
  available,
}: {
  product: {
    id: string;
    slug: string;
    title: string;
    price: number;
    currency: string;
    url: string;
    image?: string;
  };
  available: boolean;
}) {
  const [notice, setNotice] = useState("");
  const [saved, setSaved] = useState(false);
  const [favoriteError, setFavoriteError] = useState("");
  const reduceMotion = useReducedMotion();

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

  function addSelection() {
    try {
      addToCart(product);
      setNotice("Added to your selection. Your order will be completed on Etsy.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Your selection could not be saved.");
    }
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
    <>
      <div className="product-purchase-actions">
        <m.a
          className="btn btn-dark product-etsy-purchase"
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!available}
          whileHover={available && !reduceMotion ? { y: -2 } : undefined}
          whileTap={available && !reduceMotion ? { scale: 0.98 } : undefined}
          onClick={(event) => {
            if (!available) event.preventDefault();
          }}
        >
          {available ? "BUY ON ETSY ↗" : "UNAVAILABLE ON ETSY"}
        </m.a>
        <MotionButton type="button" className="btn btn-outline-dark" onClick={addSelection} disabled={!available}>
          SAVE TO YOUR SELECTION
        </MotionButton>
        <MotionButton
          type="button"
          className={`btn btn-outline-dark product-wishlist-action${saved ? " saved" : ""}`}
          aria-label={saved ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
          aria-pressed={saved}
          onClick={onToggleFavorite}
        >
          <Heart size={17} fill={saved ? "currentColor" : "none"} aria-hidden="true" />
          <span>{saved ? "SAVED TO WISHLIST" : "ADD TO WISHLIST"}</span>
        </MotionButton>
      </div>
      {favoriteError && <p className="storage-error product-wishlist-error" role="status">{favoriteError}</p>}
      <AnimatePresence initial={false}>
        {notice && (
          <m.p
            key="selection-notice"
            className="form-note"
            role="status"
            initial={reduceMotion ? false : { opacity: 0, y: 7 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
          >
            {notice}
          </m.p>
        )}
      </AnimatePresence>
    </>
  );
}
