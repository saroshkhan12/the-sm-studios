import fs from "node:fs/promises";
import path from "node:path";

export type EtsyProduct = {
  id: string;
  listingId: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  collection: string;
  type: "physical" | "apparel" | "digital";
  price: number;
  currency: string;
  image?: string;
  images: string[];
  available: boolean;
  quantity?: number;
  url: string;
  tags: string[];
  variations: { name: string; options: string[] }[];
  sku?: string;
  createdAt?: string;
  updatedAt?: string;
  source: "etsy";
};

type EtsyListing = Record<string, unknown> & {
  listing_id?: number | string;
  title?: string;
  description?: string;
  state?: string;
  quantity?: number;
  price?: number | { amount?: number; divisor?: number };
  currency_code?: string;
  url?: string;
  tags?: unknown[];
  images?: EtsyImage[];
  updated_timestamp?: number;
  created_timestamp?: number;
  taxonomy_path?: string[];
  is_digital?: boolean;
  _listingImages?: EtsyImage[];
  _inventory?: InventoryResponse;
};

type EtsyImage = {
  url_fullxfull?: string;
  url_570xN?: string;
  url_170x135?: string;
  url_75x75?: string;
};

type InventoryResponse = {
  products?: {
    sku?: string;
    property_values?: {
      property_name?: string;
      values?: string[];
    }[];
  }[];
};

export type EtsySyncStatus = {
  status: "success" | "partial";
  syncedAt: string;
  totalProducts: number;
  activeListings: number;
  successfulProducts: number;
  failedImageDownloads: number;
};

const dataDirectory = path.join(process.cwd(), ".data");
const productsStore = path.join(dataDirectory, "etsy-products.json");
const statusStore = path.join(dataDirectory, "etsy-sync-status.json");
const apiBase = "https://api.etsy.com/v3/application";

export class EtsyIntegrationError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "EtsyIntegrationError";
  }
}

function headers() {
  const configuredKey = process.env.ETSY_API_KEY;
  if (!configuredKey) throw new Error("ETSY_API_KEY is not configured.");

  const [keyString, sharedSecret, ...extra] = configuredKey.trim().split(":");
  if (!keyString?.trim() || !sharedSecret?.trim() || extra.length) {
    throw new Error("ETSY_API_KEY must use keystring:shared_secret format.");
  }

  return {
    "x-api-key": `${keyString.trim()}:${sharedSecret.trim()}`,
    ...(process.env.ETSY_ACCESS_TOKEN
      ? { Authorization: `Bearer ${process.env.ETSY_ACCESS_TOKEN}` }
      : {}),
  };
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown, fallback = 0): number {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function productTags(listing: EtsyListing): string[] {
  return Array.isArray(listing.tags)
    ? listing.tags
        .map((tag) => (typeof tag === "string" ? tag : ""))
        .filter(Boolean)
    : [];
}

function categoryFor(listing: EtsyListing) {
  const taxonomy = Array.isArray(listing.taxonomy_path)
    ? listing.taxonomy_path.join(" ")
    : "";
  const searchable =
    `${asString(listing.title)} ${productTags(listing).join(" ")} ${taxonomy}`.toLowerCase();

  if (
    listing.is_digital === true ||
    /digital|download|printable/.test(searchable)
  ) {
    return {
      category: "Digital Prints",
      collection: "digital-artwork",
      type: "digital" as const,
    };
  }
  if (/hoodie|sweatshirt|shirt|apparel|clothing/.test(searchable)) {
    return {
      category: "Apparel",
      collection: "apparel",
      type: "apparel" as const,
    };
  }
  if (/palestine|gaza|jerusalem|keffiyeh/.test(searchable)) {
    return {
      category: "Palestine & Identity",
      collection: "palestine-identity",
      type: "physical" as const,
    };
  }
  if (/islam|quran|kaaba|mecca|mosque|arabic|calligraphy|sabr/.test(searchable)) {
    return {
      category: "Islamic & Calligraphy Art",
      collection: "islamic-art",
      type: "physical" as const,
    };
  }
  return {
    category: "Wall Art & Prints",
    collection: "posters-prints",
    type: "physical" as const,
  };
}

function imageUrls(images: EtsyImage[] | undefined): string[] {
  if (!Array.isArray(images)) return [];
  return images
    .map(
      (image) =>
        image.url_fullxfull ||
        image.url_570xN ||
        image.url_170x135 ||
        image.url_75x75,
    )
    .filter((url): url is string => Boolean(url?.startsWith("https://")));
}

function normalize(listing: EtsyListing): EtsyProduct {
  const listingId = asNumber(listing.listing_id);
  const title = asString(listing.title) || "Untitled Etsy listing";
  const images = imageUrls(listing._listingImages || listing.images);
  const price = listing.price;
  const amount =
    typeof price === "object" && price !== null
      ? asNumber(price.amount) / Math.max(1, asNumber(price.divisor, 1))
      : asNumber(price) / 100;
  const updatedAt = asNumber(listing.updated_timestamp);
  const createdAt = asNumber(listing.created_timestamp);

  return {
    id: `etsy-${listingId}`,
    listingId,
    slug: `${title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 65)}-${listingId}`,
    title,
    description: asString(listing.description),
    ...categoryFor(listing),
    price: amount,
    currency: asString(listing.currency_code) || "USD",
    image: images[0],
    images,
    available:
      listing.state === "active" && asNumber(listing.quantity, 1) > 0,
    quantity:
      listing.quantity === undefined
        ? undefined
        : asNumber(listing.quantity),
    url:
      asString(listing.url) ||
      `https://www.etsy.com/listing/${listingId}`,
    tags: productTags(listing),
    variations: [],
    createdAt: createdAt ? new Date(createdAt * 1000).toISOString() : undefined,
    updatedAt: updatedAt
      ? new Date(updatedAt * 1000).toISOString()
      : undefined,
    source: "etsy",
  };
}

async function readJsonFile<T>(file: string): Promise<T | undefined> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

export async function readEtsyProducts(): Promise<EtsyProduct[]> {
  return (await readJsonFile<EtsyProduct[]>(productsStore)) || [];
}

export async function readEtsySyncStatus(): Promise<EtsySyncStatus | null> {
  return (await readJsonFile<EtsySyncStatus>(statusStore)) || null;
}

export async function resolveEtsyShopId(): Promise<string> {
  const configuredId = process.env.ETSY_SHOP_ID?.trim();
  if (configuredId) {
    if (!/^\d+$/.test(configuredId)) {
      throw new EtsyIntegrationError(
        400,
        "ETSY_SHOP_ID must contain digits only.",
      );
    }
    return configuredId;
  }

  const shopName = (process.env.ETSY_SHOP_NAME || "TheSMStudios").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(shopName)) {
    throw new EtsyIntegrationError(400, "The configured Etsy shop name is invalid.");
  }

  const lookup = new URL(`${apiBase}/shops`);
  lookup.searchParams.set("shop_name", shopName);
  lookup.searchParams.set("limit", "10");
  const found = await fetch(lookup, {
    headers: headers(),
    cache: "no-store",
  });
  if (found.ok) {
    const data = await found.json();
    const match = (data.results || []).find(
      (shop: Record<string, unknown>) =>
        asString(shop.shop_name).toLowerCase() === shopName.toLowerCase(),
    );
    if (match?.shop_id && /^\d+$/.test(String(match.shop_id))) {
      return String(match.shop_id);
    }
  } else {
    console.error("[Etsy sync] Shop-name lookup failed", {
      status: found.status,
      shopName,
    });
  }

  try {
    const publicPage = await fetch(
      `https://www.etsy.com/shop/${encodeURIComponent(shopName)}`,
      {
        headers: {
          "user-agent": "THE-SM-STUDIOS-Website/1.0",
          accept: "text/html",
        },
        cache: "no-store",
        redirect: "follow",
      },
    );
    if (publicPage.ok) {
      const html = await publicPage.text();
      const matches = [
        ...html.matchAll(/(?:shop[_-]?id|shopId)["'=: ]+(\d{4,})/gi),
        ...html.matchAll(/\/shops\/(\d{4,})/gi),
      ];
      for (const match of matches) {
        if (/^\d{4,}$/.test(match[1])) return match[1];
      }
    } else {
      console.error("[Etsy sync] Public shop lookup failed", {
        status: publicPage.status,
        shopName,
      });
    }
  } catch {
    console.error("[Etsy sync] Public shop lookup request failed", { shopName });
  }

  throw new EtsyIntegrationError(
    found.ok ? 502 : found.status,
    "The Etsy shop ID could not be verified from the API or public shop page.",
  );
}

function retryDelay(response: Response | undefined, attempt: number): number {
  const retryAfter = response?.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    const requestedDelay = Number.isFinite(seconds)
      ? seconds * 1000
      : Date.parse(retryAfter) - Date.now();
    if (Number.isFinite(requestedDelay) && requestedDelay > 0) {
      return Math.min(requestedDelay, 60_000);
    }
  }
  return Math.min(30_000, 2_000 * 2 ** attempt);
}

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function syncEtsyProducts() {
  const shopId = await resolveEtsyShopId();
  const listings: EtsyListing[] = [];
  let offset = 0;
  const limit = 100;

  for (;;) {
    const url = new URL(
      `${apiBase}/shops/${encodeURIComponent(shopId)}/listings/active`,
    );
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("includes", "Images");
    const response = await fetch(url, { headers: headers(), cache: "no-store" });
    if (!response.ok) {
      const status = response.status;
      await response.text();
      console.error("[Etsy sync] Active listings lookup failed", {
        status,
        shopIdConfigured: Boolean(process.env.ETSY_SHOP_ID),
      });
      throw new EtsyIntegrationError(
        status,
        `Etsy returned status ${status} while retrieving active listings.`,
      );
    }

    const data = await response.json();
    const batch = Array.isArray(data.results)
      ? (data.results as EtsyListing[])
      : [];
    listings.push(...batch);
    if (batch.length < limit || listings.length >= asNumber(data.count)) break;
    offset += batch.length;
  }

  const uniqueListings = Array.from(
    new Map(
      listings.map((listing) => [String(listing.listing_id), listing]),
    ).values(),
  );
  const cachedProducts = await readEtsyProducts();
  const cachedByListingId = new Map(
    cachedProducts.map((product) => [String(product.listingId), product]),
  );

  let lastImageRequestAt = 0;
  let failedImageDownloads = 0;
  for (const listing of uniqueListings) {
    const spacing = Math.max(0, 1_000 - (Date.now() - lastImageRequestAt));
    if (spacing) await wait(spacing);

    let response: Response | undefined;
    let imageRecords: EtsyImage[] = [];
    let failureStatus: number | undefined;
    let networkFailure = false;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        response = await fetch(
          `${apiBase}/listings/${encodeURIComponent(String(listing.listing_id))}/images`,
          { headers: headers(), cache: "no-store" },
        );
        lastImageRequestAt = Date.now();
        if (response.ok) {
          const payload = await response.json();
          imageRecords = Array.isArray(payload.results)
            ? (payload.results as EtsyImage[])
            : [];
          failureStatus = undefined;
          networkFailure = false;
          break;
        }

        failureStatus = response.status;
        if (
          (response.status === 429 || response.status >= 500) &&
          attempt < 4
        ) {
          const delay = retryDelay(response, attempt);
          await response.body?.cancel();
          await wait(delay);
          continue;
        }
        await response.body?.cancel();
        break;
      } catch {
        networkFailure = true;
        lastImageRequestAt = Date.now();
        if (attempt < 4) {
          await wait(retryDelay(undefined, attempt));
          continue;
        }
      }
    }

    const listingId = String(listing.listing_id);
    const cachedImages = cachedByListingId.get(listingId)?.images || [];
    const responseImages = imageUrls(imageRecords);
    if (responseImages.length) {
      listing._listingImages = imageRecords;
    } else if (cachedImages.length) {
      listing._listingImages = cachedImages.map((url_fullxfull) => ({
        url_fullxfull,
      }));
    } else {
      listing._listingImages = listing.images || [];
    }

    if (failureStatus !== undefined || networkFailure) {
      failedImageDownloads += 1;
      console.warn("[Etsy sync] Listing images unavailable; using cached data when available", {
        listingId,
        status: failureStatus || "network error",
      });
    }
  }

  if (process.env.ETSY_ACCESS_TOKEN) {
    await Promise.all(
      uniqueListings.map(async (listing) => {
        try {
          const response = await fetch(
            `${apiBase}/listings/${listing.listing_id}/inventory`,
            { headers: headers(), cache: "no-store" },
          );
          if (response.ok) {
            listing._inventory = await response.json();
          } else {
            console.warn("[Etsy sync] Optional inventory enrichment failed", {
              listingId: listing.listing_id,
              status: response.status,
            });
          }
        } catch {
          console.warn("[Etsy sync] Optional inventory enrichment failed", {
            listingId: listing.listing_id,
          });
        }
      }),
    );
  }

  const products = uniqueListings.map((listing) => {
    const product = normalize(listing);
    const inventory = listing._inventory;
    if (inventory?.products?.length) {
      const grouped = new Map<string, Set<string>>();
      for (const variant of inventory.products) {
        for (const value of variant.property_values || []) {
          const name = value.property_name || "Option";
          if (!grouped.has(name)) grouped.set(name, new Set<string>());
          for (const option of value.values || []) {
            grouped.get(name)?.add(String(option));
          }
        }
      }
      product.variations = Array.from(grouped.entries()).map(
        ([name, options]) => ({ name, options: Array.from(options) }),
      );
      const sku = inventory.products.map((variant) => variant.sku).find(Boolean);
      if (sku) product.sku = sku;
    }
    return product;
  });

  const syncedAt = new Date().toISOString();
  const status: EtsySyncStatus = {
    status: failedImageDownloads ? "partial" : "success",
    syncedAt,
    totalProducts: products.length,
    activeListings: uniqueListings.length,
    successfulProducts: products.length,
    failedImageDownloads,
  };

  await fs.mkdir(dataDirectory, { recursive: true });
  await fs.writeFile(productsStore, JSON.stringify(products, null, 2), "utf8");
  await fs.writeFile(statusStore, JSON.stringify(status, null, 2), "utf8");
  return { ...status, products };
}

export function etsyConfigured() {
  return Boolean(
    process.env.ETSY_API_KEY &&
      (process.env.ETSY_SHOP_ID ||
        process.env.ETSY_SHOP_NAME ||
        "TheSMStudios"),
  );
}
