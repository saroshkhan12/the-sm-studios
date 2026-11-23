"use client";
import { useState } from "react";
import Link from "next/link";

export type LandingNavItem = { label: string; href: string };
export function LandingPageNavigation({ brand, items, cta }: { brand: React.ReactNode; items: LandingNavItem[]; cta?: { label: string; href: string } }) {
  const [open, setOpen] = useState(false);
  return <nav className="lp-nav" aria-label="Landing page">
    <div>{brand}</div>
    <div className="lp-nav-links">{items.map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}</div>
    {cta && <Link className="lp-button lp-button-secondary" href={cta.href}>{cta.label}</Link>}
    <button className="lp-mobile-toggle" type="button" aria-expanded={open} aria-controls="lp-mobile-menu" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(v => !v)}>{open ? "Close" : "Menu"}</button>
    {open && <div className="lp-mobile-panel" id="lp-mobile-menu">{items.map((item,index) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} style={{transitionDelay:`${index*50}ms`}}>{item.label}</Link>)}{cta && <Link className="lp-button" href={cta.href} onClick={() => setOpen(false)}>{cta.label}</Link>}</div>}
  </nav>;
}
