import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Asterisk, Circle, Orbit, Sparkles } from "lucide-react";
import { readEtsyProducts, type EtsyProduct } from "@/lib/etsy";
import { ScrollReveal, StaggerItem, StaggerReveal } from "@/components/scroll-reveal";
import { StoryNavigation } from "@/components/story-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Story | THE SM STUDIOS",
  description:
    "Discover the creative point of view behind THE SM STUDIOS: art, culture, identity and expression.",
};

type StoryTheme = {
  number: string;
  title: string;
  accent: string;
  description: string;
  product?: EtsyProduct;
};

function chooseArtwork(
  products: EtsyProduct[],
  used: Set<string>,
  predicate: (product: EtsyProduct) => boolean,
) {
  const withImages = products.filter((product) => product.image);
  const product =
    withImages.find((item) => !used.has(item.id) && predicate(item)) ??
    withImages.find((item) => !used.has(item.id)) ??
    withImages[0];
  if (product) used.add(product.id);
  return product;
}

function ArtworkImage({
  product,
  className,
  sizes,
  priority = false,
}: {
  product?: EtsyProduct;
  className: string;
  sizes: string;
  priority?: boolean;
}) {
  if (!product?.image) {
    return <div className={`${className} story-artwork-empty`} aria-hidden="true" />;
  }

  return (
    <Image
      src={product.image}
      alt={product.title}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}

export default async function About() {
  const products = await readEtsyProducts();
  const artworkIds = new Set<string>();
  const heroArtwork = chooseArtwork(
    products,
    artworkIds,
    (product) => product.collection === "palestine-identity",
  );
  const philosophyArtwork = chooseArtwork(
    products,
    artworkIds,
    (product) => product.collection === "islamic-art",
  );
  const approachArtwork = chooseArtwork(
    products,
    artworkIds,
    (product) => product.type === "digital",
  );
  const closingArtwork = chooseArtwork(
    products,
    artworkIds,
    (product) => product.collection === "palestine-identity",
  );

  const storyThemes: StoryTheme[] = [
    {
      number: "01",
      title: "Art with",
      accent: "meaning.",
      description:
        "Artwork can hold an idea, express an emotion and invite a different perspective.",
      product: chooseArtwork(
        products,
        artworkIds,
        (product) => product.collection === "palestine-identity",
      ),
    },
    {
      number: "02",
      title: "Culture without",
      accent: "borders.",
      description:
        "Cultural inspiration and heritage become part of a living, evolving visual language.",
      product: chooseArtwork(
        products,
        artworkIds,
        (product) => product.collection === "islamic-art",
      ),
    },
    {
      number: "03",
      title: "Design that",
      accent: "connects.",
      description:
        "A considered design can bring people closer to the stories and ideas that matter to them.",
      product: chooseArtwork(
        products,
        artworkIds,
        (product) => product.type === "apparel" || product.type === "digital",
      ),
    },
  ];

  const values = [
    {
      number: "01",
      title: "Creativity",
      description: "Making room for ideas, imagination and new ways to see.",
      icon: Sparkles,
    },
    {
      number: "02",
      title: "Cultural expression",
      description: "Treating culture and identity as meaningful sources of expression.",
      icon: Asterisk,
    },
    {
      number: "03",
      title: "Individuality",
      description: "Celebrating personal perspective through expressive design.",
      icon: Circle,
    },
    {
      number: "04",
      title: "Meaningful design",
      description: "Creating visual work with a point of view beyond decoration.",
      icon: Orbit,
    },
  ];

  return (
    <div className="our-story-page">
      <section className="story-hero" id="story-origin">
        <div className="story-hero-inner">
          <ScrollReveal className="story-hero-copy" variant="slideInLeft">
            <span className="eyebrow">OUR STORY — THE SM STUDIOS</span>
            <h1>
              Every piece
              <br />
              tells a <em>story.</em>
              <br />
              Every design
              <br />
              carries <em>meaning.</em>
            </h1>
            <p>
              We believe art is more than something you see. It&apos;s something
              you feel, connect with and carry with you.
            </p>
            <Link href="/collections" className="story-primary-link">
              EXPLORE OUR WORLD <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
            <span className="story-hero-index" aria-hidden="true">01 / THE STUDIO</span>
          </ScrollReveal>

          <ScrollReveal className="story-hero-visual" variant="scaleIn">
            <div className="story-hero-image-wrap">
              <ArtworkImage
                product={heroArtwork}
                className="story-hero-image"
                sizes="(max-width: 760px) 100vw, 54vw"
                priority
              />
              <span className="story-hero-frame" aria-hidden="true" />
              {heroArtwork && (
                <div className="story-image-caption">
                  <span>{heroArtwork.category}</span>
                  <span>{heroArtwork.title}</span>
                </div>
              )}
            </div>
            <span className="story-hero-side-note" aria-hidden="true">
              ART · CULTURE · EXPRESSION
            </span>
          </ScrollReveal>
        </div>
        <a className="story-scroll-cue" href="#story-philosophy">
          <span>SCROLL TO DISCOVER</span>
          <ArrowDownRight size={16} aria-hidden="true" />
        </a>
      </section>

      <div className="story-body">
        <div className="story-nav-wrap">
          <StoryNavigation />
        </div>

        <section className="story-philosophy-section story-section-wrap" id="story-philosophy">
        <ScrollReveal className="story-philosophy-copy" variant="slideInLeft">
          <span className="eyebrow">A POINT OF VIEW</span>
          <h2>
            More than an image.
            <br />
            <em>A deeper expression.</em>
          </h2>
          <p className="story-philosophy-lead">
            Art is a language for identity, culture and imagination.
          </p>
          <p>
            We bring together cultural inspiration and contemporary creativity
            to make visual work that feels personal, carries meaning and gives
            ideas room to connect.
          </p>
          <div className="story-principles">
            <div><span>01</span><strong>Art <i>+</i> identity</strong></div>
            <div><span>02</span><strong>Culture <i>+</i> creativity</strong></div>
            <div><span>03</span><strong>Design <i>+</i> expression</strong></div>
          </div>
        </ScrollReveal>
        <ScrollReveal className="story-philosophy-visual" variant="scaleIn">
          <div className="story-philosophy-image">
            <ArtworkImage
              product={philosophyArtwork}
              className="story-editorial-image"
              sizes="(max-width: 760px) 100vw, 42vw"
            />
          </div>
          {philosophyArtwork && (
            <p className="story-artwork-caption">
              <span>FROM THE STUDIO COLLECTION</span>
              <strong>{philosophyArtwork.title}</strong>
            </p>
          )}
        </ScrollReveal>
        </section>

        <section className="story-themes-section" id="story-creation">
        <div className="story-section-wrap">
          <ScrollReveal className="story-section-heading">
            <div>
              <span className="eyebrow">THREE WAYS OF SEEING</span>
              <h2>
                Visual stories.
                <br />
                <em>Shared meaning.</em>
              </h2>
            </div>
            <p>
              Each collection is a different expression of the ideas, culture
              and creative energy that shape the studio.
            </p>
          </ScrollReveal>
          <StaggerReveal className="story-theme-grid">
            {storyThemes.map((theme) => {
              const image = (
                <ArtworkImage
                  product={theme.product}
                  className="story-theme-image"
                  sizes="(max-width: 650px) 88vw, (max-width: 1000px) 45vw, 29vw"
                />
              );
              return (
                <StaggerItem className="story-theme-item" key={theme.number}>
                  {theme.product ? (
                    <Link
                      className="story-theme-art"
                      href={`/shop/${theme.product.slug}`}
                      aria-label={`View ${theme.product.title}`}
                    >
                      {image}
                      <span className="story-theme-open"><ArrowUpRight size={17} /></span>
                    </Link>
                  ) : (
                    <div className="story-theme-art">{image}</div>
                  )}
                  <div className="story-theme-meta">
                    <span className="story-theme-number">{theme.number}</span>
                    <div>
                      <span className="eyebrow">THE STUDIO BELIEVES IN</span>
                      <h3>{theme.title}<br /><em>{theme.accent}</em></h3>
                      <p>{theme.description}</p>
                    </div>
                  </div>
                  {theme.product && (
                    <span className="story-theme-product">{theme.product.title}</span>
                  )}
                </StaggerItem>
              );
            })}
          </StaggerReveal>
        </div>
        </section>

        <section className="story-approach-section story-section-wrap" id="story-vision">
        <ScrollReveal className="story-approach-visual" variant="scaleIn">
          <div className="story-approach-image">
            <ArtworkImage
              product={approachArtwork}
              className="story-editorial-image"
              sizes="(max-width: 760px) 100vw, 48vw"
            />
          </div>
          <span className="story-approach-mark" aria-hidden="true">SM&nbsp;·&nbsp;STUDIO</span>
        </ScrollReveal>
        <ScrollReveal className="story-approach-copy" variant="slideInRight">
          <span className="eyebrow">OUR CREATIVE APPROACH</span>
          <h2>
            Start with an idea.
            <br />
            Shape it with <em>care.</em>
          </h2>
          <p>
            We explore the space between artistic inspiration, cultural
            influences and contemporary design. The result is a collection of
            visual languages—from expressive wall art to wearable and digital
            designs.
          </p>
          <p>
            Every piece is an invitation to find your own connection with the
            image, the idea or the story behind it.
          </p>
          <Link className="story-text-link" href="/collections">
            DISCOVER THE COLLECTIONS <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </ScrollReveal>
        </section>

        <section className="story-values-section" id="story-commitment">
        <div className="story-section-wrap">
          <ScrollReveal className="story-values-heading">
            <span className="eyebrow">WHAT GUIDES THE STUDIO</span>
            <h2>
              Values behind
              <br />
              <em>the work.</em>
            </h2>
          </ScrollReveal>
          <StaggerReveal className="story-values-list">
            {values.map(({ number, title, description, icon: Icon }) => (
              <StaggerItem className="story-value" key={number}>
                <span className="story-value-number">{number}</span>
                <Icon className="story-value-icon" size={21} strokeWidth={1.35} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{description}</p>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </div>
        </section>
      </div>

      <section className="story-closing">
        <ArtworkImage
          product={closingArtwork}
          className="story-closing-image"
          sizes="100vw"
        />
        <div className="story-closing-overlay" aria-hidden="true" />
        <ScrollReveal className="story-closing-copy">
          <span className="eyebrow">FIND YOUR POINT OF VIEW</span>
          <h2>
            Discover art
            <br />
            that <em>speaks to you.</em>
          </h2>
          <p>
            Explore expressive artwork and creative designs inspired by culture,
            identity and imagination.
          </p>
          <Link href="/collections" className="story-primary-link">
            EXPLORE THE COLLECTION <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </ScrollReveal>
      </section>
    </div>
  );
}
