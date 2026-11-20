"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  m,
  useReducedMotion,
} from "framer-motion";
import { ArrowUpRight, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { currencyLabel, type Product } from "@/data/catalog";
import { MotionButton } from "@/components/motion-button";

type SearchProduct = Product & {
  url: string;
  tags: string[];
  listingId: number;
};

export function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const loaded = useRef(false);
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!open) return;

    previousFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !overlayRef.current) return;
      const focusable = overlayRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus.current?.focus({ preventScroll: true });
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || loaded.current) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");

    fetch("/api/etsy/products", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`The product catalog could not be loaded (HTTP ${response.status}).`);
        }
        return response.json();
      })
      .then((data: { products?: unknown }) => {
        if (!Array.isArray(data.products)) {
          throw new Error("The product catalog returned an invalid response.");
        }
        setProducts(data.products as SearchProduct[]);
        loaded.current = true;
      })
      .catch((fetchError: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "The product catalog could not be loaded.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [attempt, open]);

  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return [];

    return products
      .filter((product) =>
        [
          product.title,
          product.description,
          product.category,
          product.collection,
          ...product.tags,
        ]
          .join(" ")
          .toLocaleLowerCase()
          .includes(needle),
      )
      .slice(0, 8);
  }, [products, query]);

  const suggestions = useMemo(
    () =>
      Array.from(
        new Set(
          products.flatMap((product) => [
            product.category,
            ...product.tags.slice(0, 2),
          ]),
        ),
      ).slice(0, 6),
    [products],
  );

  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  function openProduct(index: number) {
    const product = results[index];
    if (!product) return;
    onClose();
    router.push(`/shop/${product.slug}`);
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && results.length) {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp" && results.length) {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
    } else if (event.key === "Enter" && results.length) {
      event.preventDefault();
      openProduct(activeIndex < 0 ? 0 : activeIndex);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <m.div
          className="search-overlay-backdrop"
          key="catalog-search"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.22 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <m.section
            ref={overlayRef}
            className="search-overlay glass-surface"
            role="dialog"
            aria-modal="true"
            aria-labelledby="catalog-search-title"
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 10, scale: 0.99 }}
            transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="search-overlay-header">
              <div>
                <span className="eyebrow">THE SM STUDIOS · ETSY CATALOG</span>
                <h2 id="catalog-search-title">Find a piece that <em>speaks.</em></h2>
              </div>
              <MotionButton
                type="button"
                className="search-close icon-btn"
                aria-label="Close search"
                onClick={onClose}
              >
                <X aria-hidden="true" />
              </MotionButton>
            </header>

            <div className="search-overlay-input glass-control">
              <Search aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                role="combobox"
                aria-label="Search Etsy products"
                aria-autocomplete="list"
                aria-expanded={results.length > 0}
                aria-controls={results.length ? "catalog-search-results" : undefined}
                aria-activedescendant={
                  activeIndex >= 0 ? `catalog-result-${activeIndex}` : undefined
                }
                autoComplete="off"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search artwork, words or categories..."
              />
              {query && (
                <MotionButton
                  type="button"
                  className="search-clear icon-btn"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                >
                  <X size={17} />
                </MotionButton>
              )}
            </div>

            {loading ? (
              <div className="search-overlay-loading" role="status" aria-live="polite">
                <span className="search-spinner" aria-hidden="true" />
                Loading the Etsy collection…
              </div>
            ) : error ? (
              <div className="search-overlay-empty" role="alert">
                <p>{error}</p>
                <MotionButton
                  type="button"
                  className="text-link"
                  onClick={() => setAttempt((value) => value + 1)}
                >
                  TRY AGAIN <ArrowUpRight size={14} />
                </MotionButton>
              </div>
            ) : query.trim() ? (
              results.length ? (
                <div
                  id="catalog-search-results"
                  className="search-results"
                  role="listbox"
                  aria-label="Matching Etsy products"
                >
                  {results.map((product, index) => (
                    <Link
                      id={`catalog-result-${index}`}
                      key={product.id}
                      href={`/shop/${product.slug}`}
                      role="option"
                      aria-selected={activeIndex === index}
                      className={`search-result${activeIndex === index ? " is-active" : ""}`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={onClose}
                    >
                      <span className="search-result-image">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt=""
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="product-placeholder" aria-hidden="true">SM</span>
                        )}
                      </span>
                      <span className="search-result-copy">
                        <strong>{product.title}</strong>
                        <small>{product.category}</small>
                      </span>
                      <span className="search-result-price">
                        {currencyLabel(product.price, product.currency)}
                      </span>
                      <ArrowUpRight className="search-result-arrow" size={16} aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="search-overlay-empty" role="status">
                  <strong>No matching artwork found.</strong>
                  <p>Try a different title, keyword, category or tag.</p>
                </div>
              )
            ) : (
              <div className="search-suggestions">
                <span className="eyebrow">SUGGESTED FROM THE CATALOG</span>
                <div>
                  {suggestions.map((suggestion) => (
                    <MotionButton
                      key={suggestion}
                      type="button"
                      className="search-suggestion glass-chip"
                      onClick={() => setQuery(suggestion)}
                    >
                      {suggestion}
                    </MotionButton>
                  ))}
                  {!suggestions.length && !loading && (
                    <Link href="/shop" className="text-link" onClick={onClose}>
                      BROWSE THE SHOP <ArrowUpRight size={14} />
                    </Link>
                  )}
                </div>
              </div>
            )}

            <footer className="search-overlay-footer">
              <span><kbd>↑</kbd><kbd>↓</kbd> NAVIGATE</span>
              <span><kbd>ENTER</kbd> OPEN</span>
              <span><kbd>ESC</kbd> CLOSE</span>
            </footer>
          </m.section>
        </m.div>
      )}
    </AnimatePresence>
  );
}
