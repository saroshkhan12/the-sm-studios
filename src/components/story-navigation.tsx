"use client";

import { useEffect, useState } from "react";

const storySections = [
  { id: "story-origin", label: "Our story" },
  { id: "story-philosophy", label: "Philosophy" },
  { id: "story-creation", label: "Visual stories" },
  { id: "story-vision", label: "Our approach" },
  { id: "story-commitment", label: "Our values" },
];

export function StoryNavigation() {
  const [active, setActive] = useState(storySections[0].id);

  useEffect(() => {
    const targets = storySections
      .map(({ id }) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: 0 },
    );
    targets.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="story-navigation" aria-label="Our story sections">
      <div className="story-navigation-inner">
        <span className="eyebrow">IN THIS STORY</span>
        <div className="story-navigation-links">
          {storySections.map((section, index) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={active === section.id ? "active" : ""}
              aria-current={active === section.id ? "location" : undefined}
              onClick={() => setActive(section.id)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{section.label}</strong>
              <i aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
