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
  Sun,
  Moon,
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
import { LampThemeToggle } from "@/components/lamp-theme-toggle";
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
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
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
    document.body.classList.toggle("menu-open", menuOpen);
    return () => document.body.classList.remove("menu-open");
  }, [menuOpen]);

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
      {pathname !== "/experience" && <LampThemeToggle />}
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
          aria-controls="site-navigation-overlay"
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
            aria-label="Main menu"
            onClick={(event) => {
              if (event.target === event.currentTarget) setMenuOpen(false);
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: reduceMotion ? 0 : 0.2, ease: "easeOut" } }}
            transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
          >
            <div className="navigation-overlay-top">
              <Link href="/" className="navigation-overlay-brand" onClick={() => setMenuOpen(false)}>
                <Image
                  src="/images/sm-studios-logo-dark.png"
                  alt=""
                  width={44}
                  height={44}
                />
                <span>THE SM <i>STUDIOS</i></span>
              </Link>
              <MotionButton
                type="button"
                className="navigation-overlay-close"
                data-navigation-close
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              >
                <X aria-hidden="true" />
              </MotionButton>
            </div>

            <div className="navigation-overlay-content">
              <m.nav
                className="navigation-overlay-links"
                aria-label="Main navigation"
              >
                {navigation.map((item, index) => {
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <m.div
                      key={item.href}
                      className="navigation-overlay-row"
                      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: reduceMotion ? 0 : 0.35,
                        delay: reduceMotion ? 0 : index * 0.06,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={active ? "active" : ""}
                      >
                        <span className="navigation-overlay-number" aria-hidden="true">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="navigation-overlay-label">{item.label}</span>
                        <ArrowUpRight aria-hidden="true" />
                      </Link>
                    </m.div>
                  );
                })}
              </m.nav>
            </div>

            <div className="navigation-overlay-footer">
              <span className="navigation-overlay-kicker">ART · CULTURE · EXPRESSION</span>
              <p>Art, culture and connection.</p>
              <div className="navigation-overlay-actions">
                <a
                  className="navigation-overlay-etsy"
                  href="https://thesmstudios.etsy.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Shop on Etsy <ArrowUpRight size={16} aria-hidden="true" />
                </a>
                <button
                  type="button"
                  className="menu-theme"
                  aria-pressed={theme === "light"}
                  onClick={() => document.getElementById("lamp")?.click()}
                >
                  {theme === "light" ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
                  <span>{theme === "light" ? "Light mode" : "Dark mode"}</span>
                </button>
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
