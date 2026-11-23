"use client";

import type { CSSProperties, ReactNode, PointerEvent } from "react";

type SpotlightStyle = CSSProperties & {
  "--spotlight-x"?: string;
  "--spotlight-y"?: string;
};

export function SpotlightCard({ children }: { children: ReactNode }) {
  function updateSpotlight(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--spotlight-x",
      `${event.clientX - bounds.left}px`,
    );
    event.currentTarget.style.setProperty(
      "--spotlight-y",
      `${event.clientY - bounds.top}px`,
    );
  }

  return (
    <div
      className="spotlight-card"
      onPointerMove={updateSpotlight}
      style={
        {
          "--spotlight-x": "50%",
          "--spotlight-y": "50%",
        } as SpotlightStyle
      }
    >
      <span className="spotlight-card-glow" aria-hidden="true" />
      <div className="spotlight-card-content">{children}</div>
    </div>
  );
}
