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

function isSafeEtsyUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      (url.hostname === "etsy.com" || url.hostname.endsWith(".etsy.com"));
  } catch {
    return false;
  }
}

function isSafeEtsyImageUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "i.etsystatic.com";
  } catch {
    return false;
  }
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" && item.id.length > 0 &&
    typeof item.slug === "string" && item.slug.length > 0 &&
    typeof item.title === "string" && item.title.length > 0 &&
    typeof item.price === "number" && Number.isFinite(item.price) && item.price >= 0 &&
    typeof item.currency === "string" && /^[A-Z]{3}$/i.test(item.currency) &&
    Number.isInteger(item.qty) && Number(item.qty) >= 1 && Number(item.qty) <= 99 &&
    isSafeEtsyUrl(item.url)
  );
}

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartItem).map((item) => ({
      ...item,
      image: isSafeEtsyImageUrl(item.image) ? item.image : undefined,
    }));
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
  if (
    !product.id.trim() ||
    !product.slug.trim() ||
    !product.title.trim() ||
    !Number.isFinite(product.price) ||
    product.price < 0 ||
    !/^[A-Z]{3}$/i.test(product.currency) ||
    !isSafeEtsyUrl(product.url)
  ) {
    throw new Error("This listing cannot be saved because its details are invalid.");
  }

  const items = readCart();
  const existing = items.find((item) => item.id === product.id);
  if (existing && existing.qty >= 99) {
    throw new Error("You can save up to 99 of the same item.");
  }

  const safeProduct = {
    ...product,
    image: isSafeEtsyImageUrl(product.image) ? product.image : undefined,
  };

  return saveCart(
    existing
      ? items.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
        )
      : [...items, { ...safeProduct, qty: 1 }],
  );
}

export function updateCartQuantity(id: string, qty: number): CartItem[] {
  if (!Number.isInteger(qty)) {
    throw new Error("Choose a whole-number quantity.");
  }
  if (qty < 1) return removeFromCart(id);
  if (qty > 99) {
    throw new Error("You can save up to 99 of the same item.");
  }
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
