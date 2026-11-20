"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { ArrowUpDown, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/data/catalog";
import { MotionButton } from "@/components/motion-button";
import { ScrollReveal } from "@/components/scroll-reveal";

type EtsyProduct = Product & {
  url: string;
  tags: string[];
  listingId: number;
  source: "etsy";
  createdAt?: string;
  updatedAt?: string;
};
type ProductType = "all" | "physical" | "apparel" | "digital";
type SortOrder = "relevance" | "featured" | "newest" | "price-low" | "price-high" | "title";

function relevanceScore(product: EtsyProduct, needle: string) {
  const title = product.title.toLocaleLowerCase();
  const category = product.category.toLocaleLowerCase();
  const collection = product.collection.toLocaleLowerCase();
  const description = product.description.toLocaleLowerCase();
  const tokens = needle.split(/\s+/).filter(Boolean);
  const tokenScore = (text: string, weight: number) =>
    tokens.filter((token) => text.includes(token)).length * weight;
  const tagScore = tokens.reduce(
    (score, token) =>
      score +
      (product.tags || []).filter((tag) =>
        tag.toLocaleLowerCase().includes(token),
      ).length *
        25,
    0,
  );

  return (
    (title === needle ? 1000 : title.startsWith(needle) ? 700 : title.includes(needle) ? 500 : 0) +
    tokenScore(title, 60) +
    (category === needle ? 300 : category.startsWith(needle) ? 220 : category.includes(needle) ? 160 : 0) +
    tokenScore(category, 35) +
    (collection.includes(needle) ? 120 : 0) +
    tokenScore(collection, 25) +
    tagScore +
    tokenScore(description, 3)
  );
}

export default function ShopPage() {
  const [products, setProducts] = useState<EtsyProduct[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ProductType>("all");
  const [sort, setSort] = useState<SortOrder>("relevance");
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [error, setError] = useState("");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let active = true;
    fetch("/api/etsy/products")
      .then(async (response) => {
        if (!response.ok) throw new Error("The studio collection could not be loaded.");
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        if (!Array.isArray(data.products)) {
          throw new Error("The studio collection returned an invalid response.");
        }
        setProducts(data.products);
        setConfigured(Boolean(data.configured));
      })
      .catch((fetchError: unknown) => {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "The studio collection could not be loaded.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    const matches = products.filter((product) => {
      const searchable = [
        product.title,
        product.description,
        product.category,
        product.collection,
        ...(product.tags || []),
      ]
        .join(" ")
        .toLocaleLowerCase();
      return (
        (!needle || searchable.includes(needle)) &&
        (type === "all" || product.type === type)
      );
    });

    switch (sort) {
      case "relevance":
        return needle
          ? matches.sort(
              (a, b) =>
                relevanceScore(b, needle) - relevanceScore(a, needle) ||
                a.title.localeCompare(b.title),
            )
          : matches;
      case "newest":
        return matches.sort(
          (a, b) =>
            Date.parse(b.createdAt || b.updatedAt || "") -
            Date.parse(a.createdAt || a.updatedAt || ""),
        );
      case "price-low":
        return matches.sort((a, b) => a.price - b.price);
      case "price-high":
        return matches.sort((a, b) => b.price - a.price);
      case "title":
        return matches.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return matches;
    }
  }, [products, query, sort, type]);

  return (
    <div className="page-shell">
      <ScrollReveal className="page-hero" variant="fadeDown">
        <span className="eyebrow">THE STUDIO SHOP</span>
        <h1>
          Art for the
          <br />
          <em>everyday extraordinary.</em>
        </h1>
        <p>Meaningful work, made to be lived with, worn and shared.</p>
      </ScrollReveal>

      <ScrollReveal className="shop-toolbar" delay={0.04}>
        <div className="search-field shop-search glass-control">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search art, words or categories..."
            aria-label="Search products by name, keyword, description or category"
          />
          {query && (
            <MotionButton type="button" className="clear-search" onClick={() => setQuery("")} aria-label="Clear search">
              <X size={15} />
            </MotionButton>
          )}
        </div>

        <div className="filter-row glass-filter-group" aria-label="Filter by product type">
          {(
            [
              ["all", "All Work"],
              ["physical", "Physical"],
              ["apparel", "Apparel"],
              ["digital", "Digital"],
            ] as const
          ).map(([value, label]) => (
            <MotionButton
              key={value}
              type="button"
              className={`glass-chip${type === value ? " filter-active" : ""}`}
              aria-pressed={type === value}
              onClick={() => setType(value)}
            >
              {label}
            </MotionButton>
          ))}
        </div>

        <label className="search-field shop-sort glass-control">
          <ArrowUpDown size={16} aria-hidden="true" />
          <span className="sr-only">Sort products by</span>
          <select
            aria-label="Sort products by"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOrder)}
          >
            <option value="relevance">Relevance</option>
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="title">Alphabetical: A–Z</option>
          </select>
        </label>
      </ScrollReveal>

      {!loading && !error && products.length > 0 && (
        <p className="results-count" role="status" aria-live="polite">
          Showing {filtered.length} of {products.length}{" "}
          {products.length === 1 ? "product" : "products"}
        </p>
      )}

      {error ? (
        <ScrollReveal className="empty-catalog" role="alert">
          <h2>The collection<br /><em>could not be loaded.</em></h2>
          <p>{error}</p>
          <MotionButton type="button" className="btn btn-outline-dark" onClick={() => window.location.reload()}>
            TRY AGAIN
          </MotionButton>
        </ScrollReveal>
      ) : loading ? (
        <m.div className="product-grid product-grid-loading" aria-label="Loading products" aria-busy="true" initial={reduceMotion ? false : "hidden"} animate="visible">
          {Array.from({ length: 8 }, (_, index) => (
            <div className="product-skeleton" key={index}>
              <div />
              <span />
              <span />
            </div>
          ))}
        </m.div>
      ) : filtered.length ? (
        <m.div className="product-grid">
          <AnimatePresence mode="popLayout">
            {filtered.map((product) => (
              <m.div
                key={product.id}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
              >
                <ProductCard product={product} />
              </m.div>
            ))}
          </AnimatePresence>
        </m.div>
      ) : products.length ? (
        <ScrollReveal className="empty-catalog compact" role="status">
          <span>✳</span>
          <h2>No pieces<br /><em>found this time.</em></h2>
          <p>Try another search or clear the current filters to explore the full collection.</p>
          <MotionButton type="button" className="btn btn-outline-dark" onClick={() => { setQuery(""); setType("all"); }}>
            CLEAR SEARCH & FILTERS
          </MotionButton>
        </ScrollReveal>
      ) : (
        <ScrollReveal className="empty-catalog">
          <span>✳</span>
          <h2>{configured ? "The collection is" : "Connect the studio to Etsy"}<br /><em>{configured ? "being curated." : "to publish products."}</em></h2>
          <p>{configured ? "No active Etsy listings have been synchronized yet. Run a sync from the admin integration panel." : "The Etsy API credentials are not configured yet. The catalog will populate from verified live listings after the secure server integration is configured."}</p>
          <a href="https://thesmstudios.etsy.com" target="_blank" rel="noreferrer" className="btn btn-dark">VISIT OUR ETSY SHOP ↗</a>
        </ScrollReveal>
      )}
    </div>
  );
}
