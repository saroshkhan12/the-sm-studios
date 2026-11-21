import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Diamond, Globe2, Heart, ShieldCheck } from "lucide-react";
import { collections } from "@/data/catalog";
import { readEtsyProducts } from "@/lib/etsy";
import { ProductCard } from "@/components/product-card";
import { HeroSlider } from "@/components/hero-slider";
import { ScrollReveal, StaggerItem, StaggerReveal } from "@/components/scroll-reveal";

export const dynamic = "force-dynamic";

const editorialCollectionContent = [
  {
    slug: "palestine-identity",
    number: "01",
    eyebrow: "CULTURE & IDENTITY",
    title: "Art with a voice.",
    accent: "Culture without borders.",
    description: "Artwork celebrating Palestinian culture, heritage and expression. Original pieces that give identity, history and culture a visual voice.",
    action: "EXPLORE THE COLLECTION",
    imageAlt: "Artwork from the Palestine and Identity collection",
    className: "editorial-palestine",
  },
  {
    slug: "islamic-art",
    number: "02",
    eyebrow: "FORM & SPIRIT",
    title: "Form, light",
    accent: "and devotion.",
    description: "A considered visual world inspired by Islamic architecture, geometry, calligraphy and spiritual expression.",
    action: "DISCOVER ISLAMIC ART",
    imageAlt: "Artwork from the Islamic Art collection",
    className: "editorial-islamic",
  },
  {
    slug: "arabic-calligraphy",
    number: "03",
    eyebrow: "LANGUAGE · FORM · MEANING",
    title: "Words made",
    accent: "beautiful.",
    description: "Language transformed into art through expressive Arabic lettering, rhythm and timeless visual form.",
    action: "EXPLORE ARABIC CALLIGRAPHY",
    imageAlt: "Artwork from the Arabic Calligraphy collection",
    className: "editorial-arabic",
  },
  {
    slug: "digital-artwork",
    number: "04",
    eyebrow: "THE DIGITAL ART STUDIO",
    title: "Ideas without",
    accent: "edges.",
    description: "Experimental compositions and original digital worlds made to challenge the familiar.",
    action: "EXPLORE DIGITAL ART",
    imageAlt: "Digital artwork from THE SM STUDIOS",
    className: "editorial-digital",
  },
  {
    slug: "posters-prints",
    number: "05",
    eyebrow: "ART FOR YOUR SPACE",
    title: "Art for walls",
    accent: "and everyday spaces.",
    description: "Thoughtfully selected posters and prints that bring character, colour and creative expression into the spaces around you.",
    action: "EXPLORE POSTERS & PRINTS",
    imageAlt: "Artwork from the Posters and Prints collection",
    className: "editorial-posters",
  },
  {
    slug: "apparel",
    number: "06",
    eyebrow: "ART TO LIVE IN",
    title: "Wear what",
    accent: "you believe.",
    description: "Wearable expression for people who see personal style as another way to tell a story.",
    action: "EXPLORE APPAREL",
    imageAlt: "Apparel from THE SM STUDIOS",
    className: "editorial-apparel",
  },
] as const;

export default async function Home() {
  const products = await readEtsyProducts();
  const featuredProducts = products.slice(0, 4);

  const editorialCollections = editorialCollectionContent.map((item) => ({
    ...item,
    product: products.find((product) => product.collection === item.slug && product.image),
  }));

  const philosophyArtwork =
    products.find(
      (product) =>
        product.image &&
        (product.collection === "palestine-identity" || product.collection === "islamic-art"),
    ) ?? products.find((product) => product.image);

  const heroSlides = [
    {
      id: "identity",
      collection: "palestine-identity",
      eyebrow: "INDEPENDENT CREATIVE STUDIO",
      firstLine: "Art that",
      firstAccent: "speaks.",
      secondLine: "Design that",
      secondAccent: "connects.",
      description: "Meaningful artwork, expressive designs, and creative pieces inspired by culture, identity, and imagination.",
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
    const product = products.find((item) => item.collection === slide.collection && item.image);
    const collection = collections.find((item) => item.slug === slide.collection);
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

<section className="editorial-manifesto">
        <div className="editorial-manifesto-inner">
          <ScrollReveal className="manifesto-artwork" variant="slideInLeft">
            {philosophyArtwork?.image ? (
              <Image
                src={philosophyArtwork.image}
                alt={philosophyArtwork.title}
                fill
                sizes="(max-width: 700px) 100vw, 48vw"
                className="manifesto-image"
              />
            ) : (
              <div className="manifesto-artwork-fallback" aria-hidden="true">
                <span>THE SM</span>
                <strong>STUDIOS</strong>
              </div>
            )}
            <span className="manifesto-artwork-label">ART · CULTURE · IDENTITY</span>
            <span className="manifesto-artwork-index">EST. IN IDEAS / 001</span>
          </ScrollReveal>

          <ScrollReveal className="editorial-manifesto-copy" variant="slideInRight">
            <span className="eyebrow light">OUR CREATIVE PHILOSOPHY</span>
            <h2>From activism<br />to art —<br /><em>designs that speak.</em></h2>
            <span className="manifesto-rule" aria-hidden="true"></span>
            <p>
              Every design begins with an idea. Every artwork carries a story.
              At THE SM STUDIOS, creativity is more than decoration. It is a
              way to express identity, preserve culture, communicate emotion,
              and connect people through art.
            </p>
            <p className="manifesto-signature">
              A creative platform for ideas with meaning.
            </p>
            <Link href="/about" className="manifesto-link">
              GET TO KNOW THE STUDIO <ArrowUpRight size={17} />
            </Link>
          </ScrollReveal>
        </div>
      </section>

<section className="editorial-worlds" aria-labelledby="editorial-worlds-title">
        <div className="editorial-worlds-inner">
          <ScrollReveal className="editorial-intro">
            <div>
              <span className="eyebrow">A WORLD OF IDEAS · SIX COLLECTIONS</span>
              <h2 id="editorial-worlds-title">Find the art<br />that <em>moves you.</em></h2>
            </div>
            <p>
              From cultural identity to contemporary expression, each
              collection opens a different window into the creative world of
              THE SM STUDIOS.
            </p>
          </ScrollReveal>

          <StaggerReveal className="editorial-collection-grid">
            {editorialCollections.map((item) => (
              <StaggerItem className={"editorial-collection-item " + item.className} key={item.slug}>
                <Link
                  href={"/collections/" + item.slug}
                  className="editorial-collection-card"
                  aria-label={item.action + ": " + item.slug.replaceAll("-", " ")}
                >
                  <div className="editorial-collection-image">
                    {item.product?.image ? (
                      <Image
                        src={item.product.image}
                        alt={item.imageAlt}
                        fill
                        sizes="(max-width: 700px) 100vw, (max-width: 1050px) 50vw, 58vw"
                        className="editorial-image"
                      />
                    ) : (
                      <span className="editorial-art-fallback" aria-hidden="true">
                        <span className="editorial-fallback-orbit"></span>
                        <span className="editorial-fallback-mark">
                          {item.slug === "palestine-identity"
                            ? "فلسطين"
                            : item.slug === "islamic-art"
                              ? "۞"
                              : item.slug === "digital-artwork"
                                ? "∞"
                                : "SM"}
                        </span>
                      </span>
                    )}
                    <span className="editorial-image-shade" aria-hidden="true"></span>
                    <span className="editorial-number">COLLECTION {item.number}</span>
                    <span className="editorial-image-caption">{item.eyebrow}</span>
                    <span className="editorial-arrow" aria-hidden="true">
                      <ArrowUpRight size={20} />
                    </span>
                  </div>
                  <div className="editorial-collection-copy">
                    <div>
                      <span className="eyebrow">{item.eyebrow}</span>
                      <h3>{item.title}<br /><em>{item.accent}</em></h3>
                      <p>{item.description}</p>
                    </div>
                    <span className="editorial-cta">
                      {item.action} <ArrowUpRight size={15} />
                    </span>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </div>
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
              <span className="note-symbol" aria-hidden="true"></span>
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
