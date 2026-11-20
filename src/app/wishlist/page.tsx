"use client";

import Link from "next/link";
import { m } from "framer-motion";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/data/catalog";
import { FAVORITES_EVENT, readFavorites } from "@/lib/shop-storage";
import { ScrollReveal, StaggerItem, StaggerReveal } from "@/components/scroll-reveal";

type EtsyProduct = Product & { url: string; tags: string[]; listingId: number; source: "etsy" };

export default function Wishlist() {
  const [products, setProducts] = useState<EtsyProduct[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const syncFavorites = () => setFavoriteIds(readFavorites());
    syncFavorites();
    window.addEventListener(FAVORITES_EVENT, syncFavorites);
    window.addEventListener("storage", syncFavorites);

    fetch("/api/etsy/products")
      .then(async (response) => {
        if (!response.ok) throw new Error("Your saved pieces could not be loaded.");
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data.products)) throw new Error("The saved pieces response was invalid.");
        setProducts(data.products);
      })
      .catch((fetchError: unknown) => {
        setError(fetchError instanceof Error ? fetchError.message : "Your saved pieces could not be loaded.");
      })
      .finally(() => setLoading(false));

    return () => {
      window.removeEventListener(FAVORITES_EVENT, syncFavorites);
      window.removeEventListener("storage", syncFavorites);
    };
  }, []);

  const savedProducts = products.filter((product) => favoriteIds.includes(product.id));

  return (
    <div className="page-shell">
      <ScrollReveal className="page-hero" variant="fadeDown">
        <span className="eyebrow">SAVED FOR LATER</span>
        <h1>Your <em>wishlist.</em></h1>
        <p>Keep the pieces that speak to you close at hand.</p>
      </ScrollReveal>

      {error ? (
        <ScrollReveal className="empty-catalog" role="alert">
          <h2>Your saved art<br /><em>could not be loaded.</em></h2>
          <p>{error}</p>
        </ScrollReveal>
      ) : loading ? (
        <m.div className="empty-catalog compact" role="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2>Finding your<br /><em>saved pieces.</em></h2>
        </m.div>
      ) : savedProducts.length ? (
        <ScrollReveal className="wishlist-results">
          <p className="eyebrow">{savedProducts.length} SAVED {savedProducts.length === 1 ? "PIECE" : "PIECES"}</p>
          <StaggerReveal className="product-grid">
            {savedProducts.map((product) => (
              <StaggerItem key={product.id}>
                <ProductCard product={product} />
              </StaggerItem>
            ))}
          </StaggerReveal>
        </ScrollReveal>
      ) : (
        <ScrollReveal className="empty-catalog compact">
          <span>♡</span>
          <h2>Your saved art<br /><em>will live here.</em></h2>
          <p>Tap the heart on any piece to keep it here. Your favorites are saved in this browser.</p>
          <Link className="btn btn-dark" href="/shop">EXPLORE THE SHOP</Link>
        </ScrollReveal>
      )}
    </div>
  );
}
