
export type ProductType = "physical" | "apparel" | "digital";
export type Product = {
  id: string; slug: string; title: string; category: string; collection: string;
  type: ProductType; price: number; currency: string; description: string;
  image?: string; images?: string[]; available: boolean;
  variations?: { name: string; options: string[] }[];
};

export const collections = [
  { slug: "palestine-identity", name: "Palestine & Identity", subtitle: "Art, heritage and expression.", number: "01", tone: "rose", shape: "arch" },
  { slug: "islamic-art", name: "Islamic Art", subtitle: "A study in form, light and devotion.", number: "02", tone: "sand", shape: "circle" },
  { slug: "arabic-calligraphy", name: "Arabic Calligraphy", subtitle: "Language transformed into art.", number: "03", tone: "ink", shape: "type" },
  { slug: "digital-artwork", name: "Digital Artwork", subtitle: "Original worlds for your space.", number: "04", tone: "lavender", shape: "orbit" },
  { slug: "posters-prints", name: "Posters & Prints", subtitle: "Art for walls and everyday spaces.", number: "05", tone: "cream", shape: "frame" },
  { slug: "apparel", name: "Apparel", subtitle: "Wear what you believe in.", number: "06", tone: "olive", shape: "wear" }
] as const;

// Intentionally empty until verified Etsy listings and original artwork are supplied.
export const products: Product[] = [];
export const currencyLabel = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
