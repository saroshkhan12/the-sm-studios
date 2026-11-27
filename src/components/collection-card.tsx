
import Link from "next/link";
import Image from "next/image";

export function CollectionCard({
  item,
  index,
  image,
  sizes = "(max-width: 650px) 48vw, (max-width: 900px) 30vw, 28vw",
}: {
  item: {
    slug: string;
    name: string;
    subtitle: string;
    number: string;
    tone: string;
    shape: string;
  };
  index: number;
  image?: string;
  sizes?: string;
}) {
  return (
    <Link
      href={`/collections/${item.slug}`}
      className={`collection-card glass-surface glass-surface--interactive tone-${item.tone} card-${index}`}
    >
      <div
        className={`art-placeholder glass-inset art-${item.shape}`}
        aria-hidden="true"
      >
        {image ? (
          <Image
            src={image}
            alt={`${item.name} — ${item.subtitle}`}
            fill
            sizes={sizes}
            className="collection-art-image"
          />
        ) : null}

        <span className="art-caption">
          THE SM STUDIOS / {item.number}
        </span>
      </div>

      <div className="collection-meta">
        <div>
          <span className="eyebrow">
            COLLECTION {item.number}
          </span>
          <h3>{item.name}</h3>
          <p>{item.subtitle}</p>
        </div>
      </div>
    </Link>
  );
}
