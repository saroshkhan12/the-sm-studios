import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { collections, type Product } from "@/data/catalog";
import { CollectionCard } from "@/components/collection-card";
import { ScrollReveal, StaggerItem, StaggerReveal } from "@/components/scroll-reveal";

type ExploreCollectionsSectionProps = {
  products: Product[];
  variant?: "featured" | "collections-page";
};

export function ExploreCollectionsSection({
  products,
  variant = "featured",
}: ExploreCollectionsSectionProps) {
  const featuredCollections =
    variant === "collections-page"
      ? collections.filter((item) =>
          ["palestine-identity", "islamic-art", "digital-artwork", "apparel"].includes(item.slug),
        )
      : collections
          .filter((item) =>
            products.some(
              (product) => product.collection === item.slug && product.image,
            ),
          )
          .slice(0, 4);

  return (
    <section
      className="collections-section home-collections-section section-wrap"
      aria-labelledby="home-collections-title"
    >
      <ScrollReveal className="home-collections-intro">
        <div className="home-collections-title">
          <span className="eyebrow">THE WORLD OF THE STUDIO</span>
          <h2 id="home-collections-title">Explore our <em>collections.</em></h2>
        </div>
        <div className="home-collections-description">
          <p>
            Six distinct creative worlds, brought together by art with meaning.
            Discover pieces shaped by culture, identity and imagination.
          </p>
          {variant !== "collections-page" ? (
            <Link className="text-link" href="/collections">
              VIEW ALL COLLECTIONS <ArrowUpRight size={15} />
            </Link>
          ) : null}
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
  );
}
