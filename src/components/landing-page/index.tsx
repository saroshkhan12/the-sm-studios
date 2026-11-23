import type { ReactNode } from "react";
export { TaglineReveal } from "./TaglineReveal";
export { LandingPageNavigation } from "./LandingPageNavigation";
export { ProblemSolutionSection } from "./ProblemSolutionSection";
export { LeadCaptureForm } from "./LeadCaptureForm";
export type { LandingNavItem } from "./LandingPageNavigation";
export { createLandingPageMetadata, createFaqJsonLd } from "./seo";
export { landingPageTokens, landingPageTextStyles } from "./tokens";

type Action = { label: string; href: string };
type SectionProps = { eyebrow?: string; title: string; description?: string; className?: string };
export function LandingPageContainer({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`lp-system ${className}`}>{children}</div>;
}
export function LandingPageSection({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`lp-section ${className}`}><div className="lp-container">{children}</div></section>;
}
export function HeroSection({ eyebrow, title, description, primaryAction, secondaryAction, proof, visual }: SectionProps & { primaryAction: Action; secondaryAction?: Action; proof?: string; visual?: ReactNode }) {
  return <section className="lp-section"><div className="lp-container" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,360px),1fr))",gap:48,alignItems:"center"}}>
    <div>{eyebrow && <p className="lp-eyebrow">{eyebrow}</p>}<h1 className="lp-h1 lp-gradient-text">{title}</h1>{description && <p className="lp-body-1" style={{color:"var(--lp-muted)",maxWidth:600}}>{description}</p>}<div style={{display:"flex",flexWrap:"wrap",gap:12,marginTop:28}}><a className="lp-button" href={primaryAction.href}>{primaryAction.label}</a>{secondaryAction && <a className="lp-button lp-button-secondary" href={secondaryAction.href}>{secondaryAction.label}</a>}</div>{proof && <p className="lp-caption-1" style={{color:"var(--lp-muted)",marginTop:18}}>{proof}</p>}</div>
    {visual && <div>{visual}</div>}
  </div></section>;
}
export function BenefitsSection({ title, description, benefits, className="" }: SectionProps & { benefits: {title:string;description:string;icon?:ReactNode}[] }) {
  return <LandingPageSection className={className}><header style={{maxWidth:720,marginBottom:32}}>{title && <h2 className="lp-h2">{title}</h2>}{description && <p className="lp-body-2" style={{color:"var(--lp-muted)"}}>{description}</p>}</header><div className="lp-grid-3">{benefits.slice(0,5).map((b,i)=><article className="lp-card" key={b.title}><div aria-hidden="true">{b.icon}</div><h3 className="lp-h5">{b.title}</h3><p className="lp-body-3" style={{color:"var(--lp-muted)"}}>{b.description}</p></article>)}</div></LandingPageSection>;
}
export function HowItWorksSection({ title, description, steps }: SectionProps & { steps: {title:string;description:string}[] }) {
  return <LandingPageSection><h2 className="lp-h2">{title}</h2>{description && <p className="lp-body-2" style={{color:"var(--lp-muted)"}}>{description}</p>}<div className="lp-grid-3" style={{marginTop:32}}>{steps.slice(0,3).map((step,i)=><article className="lp-card" key={step.title}><p className="lp-eyebrow">STEP 0{i+1}</p><h3 className="lp-h5">{step.title}</h3><p className="lp-body-3" style={{color:"var(--lp-muted)"}}>{step.description}</p></article>)}</div></LandingPageSection>;
}
export function SocialProofSection({ title, testimonials }: { title:string; testimonials: {quote:string;name:string;context?:string}[] }) {
  return <LandingPageSection><h2 className="lp-h2">{title}</h2><div className="lp-grid-3" style={{marginTop:32}}>{testimonials.map((t,i)=><figure className="lp-card" key={`${t.name}-${i}`}><blockquote className="lp-body-2">“{t.quote}”</blockquote><figcaption className="lp-caption-1" style={{color:"var(--lp-muted)"}}>{t.name}{t.context ? ` · ${t.context}` : ""}</figcaption></figure>)}</div></LandingPageSection>;
}
export function FAQSection({ title = "Frequently asked questions", questions }: { title?:string; questions: {question:string;answer:string}[] }) {
  return <LandingPageSection><h2 className="lp-h2">{title}</h2><div style={{marginTop:24}}>{questions.slice(0,12).map((q,i)=><details className="lp-faq-item" key={q.question}><summary>{q.question}</summary><p>{q.answer}</p></details>)}</div></LandingPageSection>;
}
export function FinalCTASection({ title, description, action, note }: {title:string;description?:string;action:Action;note?:string}) {
  return <LandingPageSection><div className="lp-card" style={{textAlign:"center",padding:"clamp(32px,6vw,72px)"}}><h2 className="lp-h2">{title}</h2>{description && <p className="lp-body-2" style={{color:"var(--lp-muted)",maxWidth:640,margin:"16px auto 26px"}}>{description}</p>}<a className="lp-button lp-button-lg" href={action.href}>{action.label}</a>{note && <p className="lp-caption-1" style={{color:"var(--lp-muted)"}}>{note}</p>}</div></LandingPageSection>;
}
export function RiskReversalSection({title,description}: {title:string;description:string}) {
  return <LandingPageSection><div className="lp-card"><h2 className="lp-h4">{title}</h2><p className="lp-body-2" style={{color:"var(--lp-muted)"}}>{description}</p></div></LandingPageSection>;
}
