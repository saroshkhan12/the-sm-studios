import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Diamond, Globe2, Heart, ShieldCheck } from "lucide-react";
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

<section className="collections-section home-collections-section section-wrap" aria-labelledby="home-collections-title">
        <ScrollReveal className="home-collections-intro">
          <div className="home-collections-title">
            <span className="eyebrow">THE WORLD OF THE STUDIO</span>
            <h2 id="home-collections-title">Explore our <em>collections.</em></h2>
          </div>
          <div className="home-collections-description">
            <p>Six distinct creative worlds, brought together by art with meaning. Discover pieces shaped by culture, identity and imagination.</p>
            <Link className="text-link" href="/collections">
              VIEW ALL COLLECTIONS <ArrowUpRight size={15} />
            </Link>
          </div>
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
