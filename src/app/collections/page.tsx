import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import "./collections-hero.css";
import "./artwork-stack-responsive.css";
import { collections } from "@/data/catalog";
import { readEtsyProducts } from "@/lib/etsy";
import { ArtworkCardStack } from "@/components/artwork-card-stack";

export const dynamic = "force-dynamic";

export default async function Collections() {
  const products = await readEtsyProducts();
  const visualItems = collections
    .map((collection) => ({
      collection,
      product: products.find((product) => product.collection === collection.slug && product.image),
    }))
    .filter((item): item is (typeof visualItems)[number] => Boolean(item.product?.image))
    .slice(0, 3);

  const stackItems = collections.map((item) => {
    const featured = products.find((product) => product.collection === item.slug);
    return {
      id: item.slug,
      title: item.name,
      subtitle: item.subtitle,
      image: featured?.image,
      href: `/collections/${item.slug}`,
      eyebrow: `COLLECTION ${item.number}`,
      detail: featured ? `Featuring ${featured.title}` : "Discover the collection",
    };
  });

  return (
    <div className="page-shell collections-page-shell">
      <section className="collections-hero" aria-labelledby="collections-hero-title">
        <div className="collections-hero-copy">
          <nav className="collections-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Collections</span>
          </nav>

          <span className="eyebrow collections-hero-eyebrow">SIX WORLDS · ONE STUDIO</span>
          <h1 id="collections-hero-title">
            Explore our<br />
            <em>collections.</em>
          </h1>
          <p className="collections-hero-subtitle">
            Different visual languages, connected by a shared belief in art with meaning.
          </p>

          <nav className="collections-quick-links" aria-label="Jump to a collection">
            {collections.map((item) => (
              <a key={item.slug} href={`#collection-${item.slug}`}>
                {item.name}
                <ArrowUpRight size={12} aria-hidden="true" />
              </a>
            ))}
          </nav>

          <div className="collections-hero-stats" aria-label="Collection statistics">
            <div>
              <strong>{String(collections.length).padStart(2, "0")}</strong>
              <span>Collections</span>
            </div>
            {products.length > 0 ? (
              <div>
                <strong>{String(products.length).padStart(2, "0")}</strong>
                <span>Available pieces</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="collections-hero-visual" aria-label="Selected collection artwork">
          <span className="collections-hero-glow" aria-hidden="true" />
          {visualItems.length > 0 ? (
            <div className="collections-artwork-composition">
              {visualItems.map(({ collection, product }, index) => (
                <figure
                  className={`collections-artwork-frame collections-artwork-frame-${index + 1}`}
                  key={collection.slug}
                >
                  <div className="collections-artwork-image">
                    <Image
                      src={product.image!}
                      alt={`${collection.name}: ${product.title}`}
                      width={560}
                      height={700}
                      sizes="(max-width: 1100px) 78vw, 34vw"
                      priority={index === 0}
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                    />
                  </div>
                  {index === 0 ? (
                    <figcaption className="collections-artwork-label">
                      {collection.number} / {collection.name}
                    </figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          ) : (
            <div className="collections-artwork-placeholder" aria-hidden="true">
              <span>THE SM STUDIOS</span>
              <strong>Art with<br /><em>meaning.</em></strong>
              <small>ART · CULTURE · EXPRESSION</small>
            </div>
          )}
          <span className="collections-visual-index" aria-hidden="true">A STUDY IN SIX WORLDS</span>
        </div>

        <a className="collections-scroll-cue" href="#artwork-stack-stage">
          <span>SCROLL TO EXPLORE</span>
          <ArrowDown size={14} aria-hidden="true" />
        </a>
        <span className="collections-hero-divider" aria-hidden="true" />
      </section>

      <ArtworkCardStack
        label="Explore our collections"
        heading=""
        items={stackItems}
      />
    </div>
  );
}
