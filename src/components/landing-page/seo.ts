import type { Metadata } from "next";

export function createLandingPageMetadata(input: {
  title: string;
  description: string;
  canonicalPath?: string;
  image?: string;
  noindex?: boolean;
}): Metadata {
  const { title, description, canonicalPath, image, noindex = false } = input;
  return {
    title,
    description,
    alternates: canonicalPath ? { canonical: canonicalPath } : undefined,
    openGraph: { title, description, type: "website", images: image ? [{ url: image }] : undefined },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : undefined },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

/** Use only with FAQ content that is also visibly rendered on the page. */
export function createFaqJsonLd(questions: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}
