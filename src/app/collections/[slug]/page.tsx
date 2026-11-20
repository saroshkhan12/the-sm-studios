
import Link from "next/link";
import { notFound } from "next/navigation";
import { collections } from "@/data/catalog";
import { readEtsyProducts } from "@/lib/etsy";
import { ProductCard } from "@/components/product-card";
import { ScrollReveal, StaggerItem, StaggerReveal } from "@/components/scroll-reveal";

export const dynamic = "force-dynamic";

export function generateStaticParams(){return collections.map(c=>({slug:c.slug}));}
export default async function CollectionDetail({params}:{params:{slug:string}}) {
 const {slug}=params; const collection=collections.find(c=>c.slug===slug); if(!collection) notFound();
 const products=await readEtsyProducts();
 const items=products.filter(p=>p.collection===slug);
 return <div className="page-shell"><ScrollReveal className="page-hero" variant="fadeDown"><span className="eyebrow">COLLECTION {collection.number}</span><h1>{collection.name.split(" ")[0]}<br/><em>{collection.name.split(" ").slice(1).join(" ")}</em></h1><p>{collection.subtitle}</p></ScrollReveal>{items.length?<StaggerReveal className="product-grid collection-products">{items.map(product=><StaggerItem key={product.id}><ProductCard product={product}/></StaggerItem>)}</StaggerReveal>:<ScrollReveal className="empty-catalog compact"><span aria-hidden="true"></span><h2>A collection in the making.</h2><p>Verified artwork and product details will appear here when an active Etsy listing matches this collection.</p><Link className="text-link" href="/shop">BACK TO THE SHOP ↗</Link></ScrollReveal>}</div>;
}
