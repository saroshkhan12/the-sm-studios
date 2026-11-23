# Landing Page Design System (opt-in)

This module adds capabilities; it is not wired into the site shell or any existing route. Import `styles.css` only in a future landing-page route that opts in, then compose components from this folder.

## Strategy checklist
- One offer, one audience, one primary conversion action.
- Record purpose, conversion event, deliverable, ideal customer, customer problem, three objections, traffic source, awareness level, proof/assets, brand voice and mobile priorities before writing.
- Mark unknown business facts as placeholders. Never fabricate proof, prices, guarantees, logos or performance metrics.

## Recommended section order
Hero → problem/solution → benefits → how it works → authentic social proof → optional TaglineReveal → FAQ (6–12) → genuine risk reversal → final CTA.

## Copy
Lead with a specific customer outcome; explain what is offered and who it is for. Use action-specific CTA labels. Prefer benefits over feature lists and avoid unsupported claims.

## Design tokens
The component-scoped stylesheet uses the approved type scale, named heading/title/body/button/caption classes, spacing values, radius utilities and motion curve. It does not alter global CSS or Tailwind configuration. Existing theme selection is read through `html[data-theme="light"]`; dark is the default.

## Motion and accessibility
Use transform/opacity only for reveals. Respect reduced motion, keep keyboard focus visible, use semantic headings and meaningful link labels. Avoid fabricated loading states: provide route-specific loading/empty/error UI where real data is connected.

## SEO/AEO
Set route-specific Next.js metadata (title, description, Open Graph image, robots) on the page that uses the system. Use semantic question/answer markup and FAQ JSON-LD only when the visible FAQ is genuine and matches the structured data. Use noindex for private or campaign-only pages when required. Link to existing privacy/terms pages rather than replacing them.

## Responsive QA
Check 390px and tablet/desktop widths, keyboard-only navigation, light/dark theme, reduced motion, no overflow, and CTA visibility. All CTA hrefs and proof content must be supplied by the page author and verified before publishing.
