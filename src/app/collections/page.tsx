import "./artwork-stack-responsive.css";
import { collections } from "@/data/catalog";import { readEtsyProducts } from "@/lib/etsy";
import { ArtworkCardStack } from "@/components/artwork-card-stack";
import { ScrollReveal } from "@/components/scroll-reveal";
import { ExploreCollectionsSection } from "@/components/explore-collections-section";

export const dynamic = "force-dynamic";

export default async function Collections() {
  const products = await readEtsyProducts();

  return (
    <div className="page-shell">
      <ScrollReveal className="page-hero" variant="fadeDown">
        <span className="eyebrow">SIX WORLDS · ONE STUDIO</span>
        <h1>Explore our<br /><em>collections.</em></h1>
        <p>Different visual languages, connected by a shared belief in art with meaning.</p>
      </ScrollReveal>
      <ArtworkCardStack
        label="Explore our collections"
        heading=""
        items={collections.map((item) => {
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
        })}
      />
      <ExploreCollectionsSection products={products} variant="collections-page" />
    </div>
  );
}
