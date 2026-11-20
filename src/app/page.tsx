import Link from "next/link";
import {
  ArrowUpRight,
  Diamond,
  Globe2,
  Heart,
  ShieldCheck,
} from "lucide-react";
import { collections } from "@/data/catalog";
import { readEtsyProducts } from "@/lib/etsy";
import { CollectionCard } from "@/components/collection-card";
import { ProductCard } from "@/components/product-card";
import { HeroSlider } from "@/components/hero-slider";
import { ScrollReveal, StaggerItem, StaggerReveal } from "@/components/scroll-reveal";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await readEtsyProducts();
  const featuredProducts = products.slice(0, 4);
  const featuredCollections = collections
    .filter((item) =>
      products.some(
        (product) => product.collection === item.slug && product.image,
      ),
    )
    .slice(0, 4);
  const heroSlides = [
    {
      id: "identity",
      collection: "palestine-identity",
      eyebrow: "INDEPENDENT CREATIVE STUDIO",
      firstLine: "Art that",
      firstAccent: "speaks.",
      secondLine: "Design that",
      secondAccent: "connects.",
      description:
        "Meaningful artwork, expressive designs, and creative pieces inspired by culture, identity, and imagination.",
      href: "/shop",
    },
    {
      id: "islamic-art",
      collection: "islamic-art",
      eyebrow: "ISLAMIC ART · FORM & SPIRIT",
      firstLine: "Form, light,",
      firstAccent: "and devotion.",
      secondLine: "A study in",
      secondAccent: "balance.",
      description: "A study in form, light and devotion.",
      href: "/collections/islamic-art",
    },
    {
      id: "digital-artwork",
      collection: "digital-artwork",
      eyebrow: "THE DIGITAL ART STUDIO",
      firstLine: "Original worlds",
      firstAccent: "for your space.",
      secondLine: "Ideas without",
      secondAccent: "edges.",
      description: "Original worlds for your space.",
      href: "/collections/digital-artwork",
    },
  ].flatMap((slide) => {
    const product = products.find(
      (item) => item.collection === slide.collection && item.image,
    );
    const collection = collections.find(
      (item) => item.slug === slide.collection,
    );
    if (!product?.image || !collection) return [];

    return [{
      ...slide,
      image: product.image,
      alt: product.title,
      caption: collection.name.toUpperCase(),
    }];
  });

  return (
    <>
      <HeroSlider slides={heroSlides} />

      <section className="brand-values" aria-label="Studio values">
        <div>
          <Diamond aria-hidden="true" />
          <span className="benefit-copy"><strong>PREMIUM QUALITY</strong><small>Art &amp; Designs</small></span>
        </div>
        <div>
          <Globe2 aria-hidden="true" />
          <span className="benefit-copy"><strong>WORLDWIDE</strong><small>Shipping</small></span>
        </div>
        <div>
          <ShieldCheck aria-hidden="true" />
          <span className="benefit-copy"><strong>SECURE CHECKOUT</strong><small>via Etsy</small></span>
        </div>
        <div>
          <Heart aria-hidden="true" />
          <span className="benefit-copy"><strong>A CREATIVE COMMUNITY</strong></span>
        </div>
      </section>

      <section className="collections-section home-collections-section section-wrap">
        <ScrollReveal className="section-heading">
          <div>
            <span className="eyebrow">OUR COLLECTIONS</span>
            <h2>Explore Our <em>Collections</em></h2>
          </div>
          <Link className="text-link" href="/collections">
            VIEW ALL COLLECTIONS <ArrowUpRight size={15} />
          </Link>
        </ScrollReveal>
        <StaggerReveal className="collection-grid home-collection-grid">
          {featuredCollections.map((item, index) => (
            <StaggerItem className="collection-reveal" key={item.slug}>
              <CollectionCard
                item={item}
                index={index}
                image={products.find((product) => product.collection === item.slug)?.image}
                sizes="(max-width: 650px) 44vw, (max-width: 1000px) 44vw, 23vw"
              />
            </StaggerItem>
          ))}
        </StaggerReveal>
      </section>

      <section className="featured-section">
        <div className="section-wrap">
          <ScrollReveal className="section-heading">
            <div>
              <span className="eyebrow light">THE STUDIO EDIT</span>
              <h2>Featured <em>artwork.</em></h2>
            </div>
            <Link className="text-link light-link" href="/shop">
              DISCOVER THE SHOP <ArrowUpRight size={15} />
            </Link>
          </ScrollReveal>
          {featuredProducts.length ? (
            <StaggerReveal className="product-grid">
              {featuredProducts.map((product) => (
                <StaggerItem key={product.id}>
                  <ProductCard product={product} />
                </StaggerItem>
              ))}
            </StaggerReveal>
          ) : (
            <ScrollReveal className="catalog-note">
              <span className="note-symbol">✳</span>
              <div>
                <span className="eyebrow light">THE FIRST EDITION IS TAKING SHAPE</span>
                <h3>Original work.<br /><em>Coming into focus.</em></h3>
                <p>
                  Our verified catalog is being prepared. We’ll share the
                  artwork, details and prices as soon as they’re confirmed.
                </p>
                <Link className="btn btn-outline-light" href="/shop">
                  VISIT THE SHOP <ArrowUpRight size={15} />
                </Link>
              </div>
            </ScrollReveal>
          )}
        </div>
      </section>

      <section className="worlds-section section-wrap">
        <ScrollReveal className="world-feature" variant="slideInLeft">
          <Link
            href="/collections/palestine-identity"
            className="world-visual world-palestine"
            aria-label="Explore Palestine and Identity"
          >
            <span className="world-visual-label">COLLECTION 01 · CULTURE &amp; IDENTITY</span>
            <span className="world-visual-mark">فلسطين</span>
            <span className="world-visual-caption">ART WITH A VOICE.<br />CULTURE WITHOUT BORDERS.</span>
          </Link>
          <div className="world-copy">
            <span className="eyebrow">PALESTINE &amp; IDENTITY</span>
            <h2>Art with a voice.<br /><em>Culture without borders.</em></h2>
            <p>
              Artwork celebrating Palestinian culture, heritage and expression.
              Discover the original listings and their details in the shop.
            </p>
            <Link className="text-link" href="/collections/palestine-identity">
              EXPLORE THE COLLECTION <ArrowUpRight size={15} />
            </Link>
          </div>
        </ScrollReveal>
        <ScrollReveal className="world-feature world-feature-reverse" variant="slideInRight">
          <Link
            href="/collections/islamic-art"
            className="world-visual world-islamic"
            aria-label="Explore Islamic Art"
          >
            <span className="world-visual-label">COLLECTION 02 · FORM &amp; SPIRIT</span>
            <span className="world-islamic-arch"><span>✳</span></span>
            <span className="world-visual-caption">A STUDY IN<br />LIGHT &amp; DEVOTION.</span>
          </Link>
          <div className="world-copy">
            <span className="eyebrow">ISLAMIC ART &amp; SPIRITUAL EXPRESSIONS</span>
            <h2>Form, light<br /><em>and devotion.</em></h2>
            <p>
              Explore a considered visual world inspired by Islamic
              architecture, calligraphy and spiritual expression. Religious
              text and original calligraphy are presented with care.
            </p>
            <Link className="text-link" href="/collections/islamic-art">
              DISCOVER ISLAMIC ART <ArrowUpRight size={15} />
            </Link>
          </div>
        </ScrollReveal>
        <StaggerReveal className="worlds-small">
          <StaggerItem className="world-small-reveal">
            <Link href="/collections/digital-artwork" className="world-small-card world-digital">
              <span className="eyebrow">THE DIGITAL ART STUDIO</span>
              <span className="world-small-mark">✳</span>
              <h3>Ideas without<br /><em>edges.</em></h3>
              <span className="text-link">EXPLORE DIGITAL ART <ArrowUpRight size={15} /></span>
            </Link>
          </StaggerItem>
          <StaggerItem className="world-small-reveal">
            <Link href="/collections/apparel" className="world-small-card world-apparel">
              <span className="eyebrow">ART TO LIVE IN</span>
              <span className="world-small-mark">SM</span>
              <h3>Wear what<br /><em>you believe.</em></h3>
              <span className="text-link">EXPLORE APPAREL <ArrowUpRight size={15} /></span>
            </Link>
          </StaggerItem>
        </StaggerReveal>
      </section>

      <section className="manifesto section-wrap">
        <ScrollReveal className="manifesto-stamp" aria-label="THE SM STUDIOS">
          <span className="manifesto-stamp-kicker">THE</span>
          <strong>SM</strong>
          <span className="manifesto-stamp-symbol">✳</span>
          <span className="manifesto-stamp-footer">STUDIOS</span>
        </ScrollReveal>
        <ScrollReveal className="manifesto-content">
          <span className="eyebrow">OUR CREATIVE PHILOSOPHY</span>
          <h2>From activism to art —<br /><em>designs that speak.</em></h2>
          <p>
            Every design begins with an idea. Every artwork carries a story. At
            THE SM STUDIOS, creativity is more than decoration. It is a way to
            express identity, preserve culture, communicate emotion, and
            connect people through art.
          </p>
          <Link href="/about" className="text-link">
            GET TO KNOW THE STUDIO <ArrowUpRight size={15} />
          </Link>
        </ScrollReveal>
      </section>

      <section className="newsletter">
        <ScrollReveal>
          <span className="eyebrow light">A NOTE FROM THE STUDIO</span>
          <h2>A little more art<br /><em>in your inbox.</em></h2>
          <p>
            We’re preparing a thoughtful way to share new artwork, collection
            notes and studio updates.
          </p>
        </ScrollReveal>
        <ScrollReveal className="newsletter-action" variant="slideInRight">
          <span className="eyebrow light">NEWSLETTER SIGN-UP IS NOT LIVE YET</span>
          <p>Until then, get in touch with the studio directly.</p>
          <Link className="btn btn-light" href="/contact">
            CONTACT THE STUDIO <ArrowUpRight size={15} />
          </Link>
        </ScrollReveal>
      </section>
    </>
  );
}
