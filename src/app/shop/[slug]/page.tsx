import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currencyLabel } from "@/data/catalog";
import { ProductGallery } from "@/components/product-gallery";
import { readEtsyProducts } from "@/lib/etsy";
import { ProductPurchaseActions } from "@/components/product-purchase-actions";
import { ScrollReveal } from "@/components/scroll-reveal";

export const dynamic = "force-dynamic";

type PageProps = { params: { slug: string } };

async function findProduct(slug: string) {
  const products = await readEtsyProducts();
  return products.find((product) => product.slug === slug);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await findProduct(params.slug);
  if (!product) return { title: "Artwork not found | THE SM STUDIOS" };
  return {
    title: `${product.title} | THE SM STUDIOS`,
    description: product.description.slice(0, 160) || `${product.category} from THE SM STUDIOS.`,
    openGraph: {
      title: product.title,
      description: product.description.slice(0, 160) || `${product.category} from THE SM STUDIOS.`,
      images: product.image ? [{ url: product.image, alt: product.title }] : [],
    },
  };
}

export default async function EtsyProductPage({ params }: PageProps) {
  const product = await findProduct(params.slug);
  if (!product) notFound();

  return (
    <div className="page-shell product-detail-shell">
      <div className="product-detail">
        <ProductGallery title={product.title} images={product.images} />

        <ScrollReveal className="product-detail-copy glass-surface" variant="slideInRight">
          <span className="eyebrow">{product.category}</span>
          <h1>{product.title}</h1>
          <p className="product-detail-price">{currencyLabel(product.price, product.currency)}</p>
          <p className="product-availability" role="status">
            <span className={product.available ? "availability-dot available" : "availability-dot"} />
            {product.available
              ? product.quantity && product.quantity > 0
                ? `Available on Etsy · ${product.quantity} in stock`
                : "Available on Etsy"
              : "Currently unavailable on Etsy"}
          </p>

          <div className="product-description">
            <h2>About this piece</h2>
            <p>{product.description || "Visit Etsy for the full listing description and product details."}</p>
          </div>

          {product.variations.length > 0 && (
            <div className="product-attributes">
              <h2>Available options</h2>
              {product.variations.map((variation) => (
                <p key={variation.name}>
                  <strong>{variation.name}:</strong> {variation.options.join(", ")}
                </p>
              ))}
              <p className="form-note">Choose your preferred options on Etsy before checkout.</p>
            </div>
          )}

          <details className="product-details-accordion">
            <summary>Product details</summary>
            <div className="product-facts">
              <p><span>Category</span><strong>{product.category}</strong></p>
              <p><span>Collection</span><strong>{product.collection.replaceAll("-", " ")}</strong></p>
              {product.sku && <p><span>Reference</span><strong>{product.sku}</strong></p>}
            </div>
            {product.tags?.length > 0 && (
              <div className="product-keywords">
                <h3>Listing keywords</h3>
                <ul>
                  {product.tags.map((tag) => <li key={tag}>{tag}</li>)}
                </ul>
              </div>
            )}
          </details>

          <ProductPurchaseActions
            product={{
              id: product.id,
              slug: product.slug,
              title: product.title,
              price: product.price,
              currency: product.currency,
              url: product.url,
              image: product.image,
            }}
            available={product.available}
          />
          <p className="eyebrow product-checkout-note">SECURE CHECKOUT & ORDER FULFILMENT BY ETSY</p>
        </ScrollReveal>
      </div>
    </div>
  );
}
