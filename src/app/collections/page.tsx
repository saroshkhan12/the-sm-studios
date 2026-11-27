
import { collections } from "@/data/catalog";
import { readEtsyProducts } from "@/lib/etsy";
import { ArtworkCardStack } from "@/components/artwork-card-stack";
import { ScrollReveal } from "@/components/scroll-reveal";

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
      <StaggerReveal className="collection-grid collection-grid-page">
        {collections.map((item, index) => (
          <StaggerItem className="collection-reveal" key={item.slug}>
            <CollectionCard
              item={item}
              index={index}
              image={products.find((product) => product.collection === item.slug)?.image}
            />
          </StaggerItem>
        ))}
      </StaggerReveal>
    </div>
  );
}
