# Usage

The feature is intentionally opt-in. No existing page imports it and no existing global file is modified.

In a future App Router page:
```tsx
import "./landing-page.css"; // a page-local stylesheet that imports the module styles
import {
  LandingPageContainer, HeroSection, BenefitsSection, TaglineReveal, FAQSection,
} from "@/components/landing-page";
import { createLandingPageMetadata } from "@/components/landing-page/seo";

export const metadata = createLandingPageMetadata({
  title: "Specific offer for a defined audience",
  description: "A concise, factual description of the offer.",
});

export default function CampaignPage() {
  return (
    <LandingPageContainer>
      <HeroSection
        eyebrow="FOR YOUR AUDIENCE"
        title="A clear outcome-led headline"
        description="Explain the actual offer and what the visitor receives."
        primaryAction={{ label: "Start the requested action", href: "/contact" }}
      />
      <TaglineReveal text="A short benefit-led statement across multiple lines." />
    </LandingPageContainer>
  );
}
```

For CSS in the page-local stylesheet, import `@/components/landing-page/styles.css`. The example is illustrative; replace all copy and links with verified campaign details. Do not add unverified testimonials, prices, guarantees or metrics.
