export const FAVORITES_KEY = "sm-favorites";
export const CART_KEY = "sm-cart";
export const FAVORITES_EVENT = "sm-favorites-update";
export const CART_EVENT = "sm-cart-update";

export type CartItem = {
  id: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
  url: string;
  image?: string;
  qty: number;
};

function readStringArray(key: string): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function readFavorites(): string[] {
  if (typeof window === "undefined") return [];
  return readStringArray(FAVORITES_KEY);
}

export function toggleFavorite(id: string): string[] {
  const current = readFavorites();
  const next = current.includes(id)
    ? current.filter((savedId) => savedId !== id)
    : [...current, id];

  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(FAVORITES_EVENT));
    return next;
  } catch {
    throw new Error("Favorites could not be saved in this browser.");
  }
}

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CartItem =>
        Boolean(item) &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.price === "number" &&
        typeof item.qty === "number" &&
        typeof item.slug === "string" &&
        typeof item.url === "string",
    );
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]): CartItem[] {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(CART_EVENT));
    return items;
  } catch {
    throw new Error("Your selection could not be saved in this browser.");
  }
}

export function addToCart(product: Omit<CartItem, "qty">): CartItem[] {
  const items = readCart();
  const existing = items.find((item) => item.id === product.id);
  return saveCart(
    existing
      ? items.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
        )
      : [...items, { ...product, qty: 1 }],
  );
}

export function updateCartQuantity(id: string, qty: number): CartItem[] {
  if (qty < 1) return removeFromCart(id);
  return saveCart(
    readCart().map((item) => (item.id === id ? { ...item, qty } : item)),
  );
}

export function removeFromCart(id: string): CartItem[] {
  return saveCart(readCart().filter((item) => item.id !== id));
}

export function clearCart(): CartItem[] {
  return saveCart([]);
}
