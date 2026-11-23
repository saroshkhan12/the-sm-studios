"use client";
import { useEffect, useMemo, useRef, useState } from "react";

export function TaglineReveal({ text, className = "" }: { text: string; className?: string }) {
  const root = useRef<HTMLParagraphElement>(null);
  const [active, setActive] = useState(false);
  const words = useMemo(() => text.trim().split(/\s+/).filter(Boolean), [text]);
  const midpoint = Math.ceil(words.length / 2);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setActive(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setActive(true); observer.disconnect(); }
    }, { threshold: 0.25 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return <p ref={root} className={`lp-tagline ${className}`} aria-label={text}>
    <span aria-hidden="true">{[words.slice(0, midpoint), words.slice(midpoint)].map((line, lineIndex) => <span className="lp-tagline-line" key={lineIndex}>{line.map((word, index) => { const wordIndex = lineIndex === 0 ? index : midpoint + index; return <span key={`${word}-${wordIndex}`} className={`lp-tagline-word ${active ? "is-lit" : ""}`} style={{ transitionDelay: active ? `${wordIndex * 55}ms` : "0ms" }}>{word}</span>; })}</span>)}</span>
  </p>;
}
