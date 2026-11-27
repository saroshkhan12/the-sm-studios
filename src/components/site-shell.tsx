"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  ArrowUpRight,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  Moon,
  Sun,
  X,
} from "lucide-react";
import {
  CART_EVENT,
  FAVORITES_EVENT,
  readCart,
  readFavorites,
} from "@/lib/shop-storage";
import {
  easeOutTransition,
  fadeDown,
  fadeUp,
  staggerContainer,
  staggerItem,
} from "@/animations/variants";
import { MotionButton } from "@/components/motion-button";
import { PageTransition } from "@/components/page-transition";
import { SearchOverlay } from "@/components/search-overlay";
import { CustomCursor } from "@/components/custom-cursor";
import { useTheme } from "@/components/theme-provider";

const navigation = [
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "Our Story", href: "/about" },
  { label: "Experience", href: "/experience" },
  { label: "Contact", href: "/contact" },
];

function NavigationLabel({ label }: { label: string }) {
  return (
    <span className="nav-label-wrap" aria-hidden="true">
      <span className="nav-label-primary">{label}</span>
      <span className="nav-label-secondary">{label}</span>
    </span>
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const menuOverlayRef = useRef<HTMLDivElement>(null);
  const previousMenuFocus = useRef<HTMLElement | null>(null);

  const openSearch = useCallback(() => {
    setMenuOpen(false);
    setSearchOpen(true);
  }, []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    const sync = () => {
      setCartCount(readCart().reduce((count, item) => count + item.qty, 0));
      setFavoritesCount(readFavorites().length);
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener(FAVORITES_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener(FAVORITES_EVENT, sync);
    };
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    previousMenuFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menuOverlayRef.current
      ?.querySelector<HTMLElement>("[data-navigation-close]")
      ?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        return;
      }

      if (event.key !== "Tab" || !menuOverlayRef.current) return;
      const focusable = menuOverlayRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href]',
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
      previousMenuFocus.current?.focus({ preventScroll: true });
    };
  }, [menuOpen]);

  useEffect(() => {
    function handleQuickSearch(event: KeyboardEvent) {
      const target = event.target;
      const typing =
        target instanceof HTMLElement &&
        (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
      if (
        event.key === "/" &&
        !typing &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !menuOpen
      ) {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", handleQuickSearch);
    return () => document.removeEventListener("keydown", handleQuickSearch);
  }, [menuOpen]);

  return (
    <>
      <div className="announcement">
        <span>FREE SHIPPING ON ORDERS OVER $50</span>
        <span className="announcement-separator" aria-hidden="true">✦</span>
        <span>ART FOR A MORE INSPIRED LIFE</span>
      </div>

      <header className="header glass-header" id="site-top">
        <MotionButton
          type="button"
          className="icon-btn mobile-menu"
          data-cursor="MENU"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls={menuOpen ? "site-navigation-overlay" : undefined}
        >
          <m.span
            key={menuOpen ? "close" : "menu"}
            initial={false}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            transition={easeOutTransition}
          >
            {menuOpen ? <X /> : <Menu />}
          </m.span>
        </MotionButton>

        <m.div
          className="wordmark-wrap"
          initial="hidden"
          animate="visible"
          variants={fadeDown}
        >
          <Link href="/" className="wordmark glass-wordmark" aria-label="THE SM STUDIOS home">
            <span className="wordmark-type">
              THE SM <i>STUDIOS</i>
              <small>ART · CULTURE · EXPRESSION</small>
            </span>
          </Link>
        </m.div>

        <nav className="nav desktop-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            (() => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const homeShopHighlight = pathname === "/" && item.href === "/shop";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`glass-nav-link${active || homeShopHighlight ? " active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  data-cursor="OPEN"
                >
                  <NavigationLabel label={item.label} />
                  <AnimatePresence initial={false}>
                    {active && (
                      <m.span
                        key={item.href}
                        className="nav-indicator"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        exit={{ scaleX: 0 }}
                        transition={easeOutTransition}
                      />
                    )}
                  </AnimatePresence>
                </Link>
              );
            })()
          ))}
        </nav>

        <m.div
          className="header-actions"
          initial="hidden"
          animate="visible"
          variants={fadeDown}
        >
          <MotionButton
            type="button"
            className="icon-btn theme-toggle"
            data-cursor="THEME"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={theme === "light"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={(event) => {
              const bounds = event.currentTarget.getBoundingClientRect();
              toggleTheme({ x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 });
            }}
          >
            {theme === "dark" ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
          </MotionButton>
          <MotionButton
            type="button"
            className="icon-btn"
            data-cursor="SEARCH"
            aria-label="Search products"
            aria-haspopup="dialog"
            aria-expanded={searchOpen}
            onClick={openSearch}
          >
            <m.span whileHover={reduceMotion ? undefined : { rotate: 8, scale: 1.08 }}>
              <Search />
            </m.span>
          </MotionButton>
          <Link
            href="/wishlist"
            className="icon-btn counted-icon"
            aria-label={`Wishlist, ${favoritesCount} saved ${favoritesCount === 1 ? "item" : "items"}`}
            data-cursor="SAVE"
          >
            <m.span whileHover={reduceMotion ? undefined : { scale: 1.12 }}>
              <Heart />
            </m.span>
            <span className="header-count">{favoritesCount}</span>
          </Link>
          <Link
            href="/cart"
            className="icon-btn bag counted-icon"
            aria-label={`Shopping bag, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
            data-cursor="OPEN BAG"
          >
            <m.span whileHover={reduceMotion ? undefined : { y: -2, scale: 1.08 }}>
              <ShoppingBag />
            </m.span>
            <span className="header-count">{cartCount}</span>
          </Link>
        </m.div>
      </header>

      <AnimatePresence initial={false}>
        {menuOpen && (
          <m.div
            id="site-navigation-overlay"
            ref={menuOverlayRef}
            key="site-navigation-overlay"
            className="navigation-overlay glass-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            onClick={(event) => {
              if (event.target === event.currentTarget) setMenuOpen(false);
            }}
            initial={reduceMotion ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: reduceMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="navigation-overlay-top">
              <Link href="/" className="navigation-overlay-brand" onClick={() => setMenuOpen(false)}>
                <Image
                  src="/images/sm-studios-logo-dark.png"
                  alt=""
                  width={72}
                  height={50}
                />
                <span>THE SM <i>STUDIOS</i></span>
              </Link>
              <MotionButton
                type="button"
                className="navigation-overlay-close icon-btn"
                data-navigation-close
                data-cursor="CLOSE"
                aria-label="Close navigation"
                onClick={() => setMenuOpen(false)}
              >
                <X />
              </MotionButton>
            </div>
            <div className="navigation-overlay-content">
              <m.nav
                className="navigation-overlay-links"
                aria-label="Main navigation"
                initial={reduceMotion ? false : "hidden"}
                animate="visible"
                variants={staggerContainer}
              >
                {navigation.map((item, index) => {
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <m.div key={item.href} variants={reduceMotion ? undefined : staggerItem}>
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        aria-label={item.label}
                        aria-current={active ? "page" : undefined}
                        className={active ? "active" : ""}
                        data-cursor="OPEN"
                      >
                        <span className="navigation-overlay-number">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="navigation-overlay-label" aria-hidden="true">
                          {Array.from(item.label).map((character, characterIndex) => (
                            <m.span
                              key={`${character}-${characterIndex}`}
                              initial={reduceMotion ? false : { y: "115%" }}
                              animate={{ y: "0%" }}
                              transition={{
                                duration: reduceMotion ? 0 : 0.38,
                                delay: reduceMotion ? 0 : index * 0.05 + characterIndex * 0.014,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                            >
                              {character === " " ? "\u00a0" : character}
                            </m.span>
                          ))}
                        </span>
                        <ArrowUpRight aria-hidden="true" />
                      </Link>
                    </m.div>
                  );
                })}
              </m.nav>
              <div className="navigation-overlay-aside">
                <span className="eyebrow">ART · CULTURE · EXPRESSION</span>
                <p>Meaningful artwork, expressive designs and original creative pieces.</p>
                <a
                  href="https://thesmstudios.etsy.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="ETSY"
                >
                  SHOP ON ETSY <ArrowUpRight size={15} />
                </a>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      <SearchOverlay open={searchOpen} onClose={closeSearch} />

      <main>
        <PageTransition>{children}</PageTransition>
      </main>

      <m.footer
        className="footer glass-footer"
        initial="hidden"
        whileInView={reduceMotion ? undefined : "visible"}
        viewport={{ once: true, amount: 0.08 }}
        variants={fadeUp}
      >
        <m.div
          className="footer-top"
          initial="hidden"
          whileInView={reduceMotion ? undefined : "visible"}
          viewport={{ once: true, amount: 0.1 }}
          variants={staggerContainer}
        >
          <m.div variants={staggerItem}>
              <Link href="/" className="footer-logo" aria-label="THE SM STUDIOS home">
                <Image
                  src="/images/sm-studios-logo-dark.png"
                  alt=""
                  width={92}
                  height={62}
                  className="brand-logo-image"
                />
                <span className="footer-logo-copy">
                  <strong>THE SM STUDIOS</strong>
                  <small>FROM ACTIVISM TO ART — DESIGNS THAT SPEAK.</small>
                </span>
            </Link>
            <p>Creative work with a point of view. Art that carries stories, culture and connection.</p>
          </m.div>
          <m.div variants={staggerItem}>
            <h4>EXPLORE</h4>
            <Link href="/shop">All artwork</Link>
            <Link href="/collections">Collections</Link>
            <Link href="/about">Our story</Link>
            <Link href="/experience">Immersive experience</Link>
          </m.div>
          <m.div variants={staggerItem}>
            <h4>CUSTOMER CARE</h4>
            <Link href="/contact">Contact the studio</Link>
            <a href="https://thesmstudios.etsy.com" target="_blank" rel="noopener noreferrer">
              Visit our Etsy shop
            </a>
          </m.div>
          <m.div variants={staggerItem}>
            <h4>ART &amp; EXPRESSION</h4>
            <Link href="/collections">Explore collections</Link>
            <Link href="/wishlist">Saved artwork</Link>
          </m.div>
        </m.div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} THE SM STUDIOS. ALL RIGHTS RESERVED.</span>
          <span>INDEPENDENT ART. MEANINGFUL DESIGN.</span>
          <Link href="#site-top" className="back-to-top" data-cursor="TOP">
            BACK TO TOP <ArrowUp size={13} aria-hidden="true" />
          </Link>
        </div>
      </m.footer>
      <CustomCursor />
    </>
  );
}
