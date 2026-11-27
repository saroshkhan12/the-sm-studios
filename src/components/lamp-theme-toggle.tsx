"use client";

import { useRef, type PointerEvent } from "react";
import { useTheme } from "@/components/theme-provider";

export function LampThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pullRef = useRef<SVGGElement>(null);
  const pointerStart = useRef<number | null>(null);
  const dragged = useRef(false);
  const suppressClick = useRef(false);

  const switchTheme = () => {
    const bounds = buttonRef.current?.getBoundingClientRect();
    toggleTheme(
      bounds
        ? { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 }
        : undefined,
    );
  };

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    pointerStart.current = event.clientY;
    dragged.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (pointerStart.current === null || !pullRef.current) return;
    const distance = Math.max(0, Math.min(34, event.clientY - pointerStart.current));
    pullRef.current.style.transform = `translateY(${distance}px)`;
    if (distance > 8) dragged.current = true;
  }

  function finishPointer(event: PointerEvent<HTMLButtonElement>) {
    if (pointerStart.current === null) return;
    const distance = Math.max(0, event.clientY - pointerStart.current);
    pointerStart.current = null;
    if (pullRef.current) pullRef.current.style.transform = "";
    if (dragged.current) {
      suppressClick.current = true;
      if (distance >= 18) switchTheme();
      window.setTimeout(() => {
        suppressClick.current = false;
      }, 0);
    }
  }

  function cancelPointer() {
    pointerStart.current = null;
    dragged.current = false;
    if (pullRef.current) pullRef.current.style.transform = "";
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      className="icon-btn lamp-theme-toggle"
      data-cursor="THEME"
      role="switch"
      aria-checked={theme === "light"}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Pull or click to turn the light on" : "Pull or click to turn the light off"}
      onClick={() => {
        if (suppressClick.current) {
          suppressClick.current = false;
          return;
        }
        switchTheme();
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointer}
      onPointerCancel={cancelPointer}
    >
      <svg viewBox="0 0 120 180" aria-hidden="true" focusable="false">
        <line className="lamp-cord" x1="60" y1="0" x2="60" y2="48" />
        <path className="lamp-shade" d="M30 50 Q60 36 90 50 L108 96 H12 Z" />
        <rect className="lamp-shade-rim" x="12" y="94" width="96" height="8" rx="4" />
        <ellipse className="lamp-bulb" cx="60" cy="108" rx="13" ry="10" />
        <g ref={pullRef} className="lamp-pull">
          <line className="lamp-cord" x1="60" y1="100" x2="60" y2="150" />
          <circle className="lamp-bead" cx="60" cy="156" r="8" />
        </g>
      </svg>
      <span className="sr-only">{theme === "light" ? "Light mode is on" : "Dark mode is on"}</span>
    </button>
  );
}
