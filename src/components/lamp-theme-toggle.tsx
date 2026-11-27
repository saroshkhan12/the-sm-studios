"use client";

import { useEffect, useRef, type MouseEvent, type PointerEvent } from "react";
import { useTheme } from "@/components/theme-provider";

const AX = 80;
const AY = 170;
const LEN = 190;

type CordMotion = {
  x: number; y: number; vx: number; vy: number;
  dragging: boolean; tx: number; ty: number;
};

export function LampThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const lampRef = useRef<HTMLButtonElement>(null);
  const cordRef = useRef<SVGPathElement>(null);
  const hitRef = useRef<SVGPathElement>(null);
  const beadRef = useRef<SVGGElement>(null);
  const flickerTimer = useRef<number | null>(null);
  const motion = useRef<CordMotion>({ x: 0, y: 0, vx: 0, vy: 0, dragging: false, tx: 0, ty: 0 });
  const pointer = useRef<{ startX: number; startY: number; moved: boolean; fired: boolean } | null>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animationFrame = 0;

    const draw = () => {
      const { x, y } = motion.current;
      const bx = AX + x;
      const by = AY + LEN + y;
      const cx = AX + x * 0.2;
      const cy = (AY + by) / 2;
      const path = `M${AX} ${AY} Q${cx} ${cy} ${bx} ${by}`;
      cordRef.current?.setAttribute("d", path);
      hitRef.current?.setAttribute("d", path);
      beadRef.current?.setAttribute("transform", `translate(${bx} ${by}) rotate(${-x * 0.7})`);
    };

    const frame = (now: number) => {
      const state = motion.current;
      const sway = reduceMotion ? 0 : Math.sin(now / 1200) * 4;
      if (state.dragging) {
        state.x += (state.tx - state.x) * 0.35;
        state.y += (state.ty - state.y) * 0.35;
        state.vx = 0;
        state.vy = 0;
      } else {
        state.vx = (state.vx + (sway - state.x) * 0.05) * 0.92;
        state.vy = (state.vy - state.y * 0.09) * 0.9;
        state.x += state.vx;
        state.y += state.vy;
      }
      draw();
      animationFrame = window.requestAnimationFrame(frame);
    };

    draw();
    animationFrame = window.requestAnimationFrame(frame);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      if (flickerTimer.current !== null) window.clearTimeout(flickerTimer.current);
    };
  }, []);

  const switchTheme = () => {
    const bounds = lampRef.current?.getBoundingClientRect();
    toggleTheme(bounds ? { x: bounds.left + bounds.width / 2, y: bounds.top + 158 } : undefined);
    if (theme === "dark" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const lamp = lampRef.current;
      if (lamp) {
        lamp.classList.remove("flicker");
        void lamp.offsetWidth;
        lamp.classList.add("flicker");
        if (flickerTimer.current !== null) window.clearTimeout(flickerTimer.current);
        flickerTimer.current = window.setTimeout(() => lamp.classList.remove("flicker"), 700);
      }
    }
  };

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointer.current = { startX: event.clientX, startY: event.clientY, moved: false, fired: false };
    motion.current.dragging = true;
    lampRef.current?.classList.add("grabbing");
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const state = pointer.current;
    if (!state) return;
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    motion.current.tx = Math.max(-25, Math.min(25, dx * 0.6));
    motion.current.ty = Math.max(0, Math.min(60, dy));
    if (Math.abs(dx) > 4 || dy > 4) state.moved = true;
    if (motion.current.ty >= 40 && !state.fired) {
      state.fired = true;
      switchTheme();
    }
  }

  function handlePointerUp(event: PointerEvent<SVGSVGElement>) {
    const state = pointer.current;
    if (!state) return;
    pointer.current = null;
    motion.current.dragging = false;
    lampRef.current?.classList.remove("grabbing");
    if (!state.moved) {
      switchTheme();
      motion.current.vy = 10;
    } else if (state.fired) {
      motion.current.vy = -3;
    }
    motion.current.tx = 0;
    motion.current.ty = 0;
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture can already have been released by the browser.
    }
  }

  function handleKeyboardClick(event: MouseEvent<HTMLButtonElement>) {
    if (event.detail === 0) switchTheme();
  }

  return (
    <button
      ref={lampRef}
      className="lamp"
      id="lamp"
      type="button"
      role="switch"
      aria-label="Dark mode"
      aria-checked={theme === "dark"}
      title={theme === "dark" ? "Pull the chain or press to turn the light on" : "Pull the chain or press to turn the light off"}
      onClick={handleKeyboardClick}
    >
      <svg
        id="lampSvg"
        viewBox="0 0 160 400"
        aria-hidden="true"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <defs>
          <linearGradient id="shadeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#b8924f" />
            <stop offset=".35" stopColor="#e2c48a" />
            <stop offset=".7" stopColor="#c9a46b" />
            <stop offset="1" stopColor="#8f6f3a" />
          </linearGradient>
          <radialGradient id="beadGrad" cx=".35" cy=".3" r=".8">
            <stop offset="0" stopColor="#f6e2b0" />
            <stop offset="1" stopColor="#b8924f" />
          </radialGradient>
        </defs>
        <rect className="l-brass" x="62" y="0" width="36" height="6" rx="3" />
        <line className="l-wire" x1="80" y1="6" x2="80" y2="68" />
        <rect className="l-brass l-cap" x="70" y="66" width="20" height="14" rx="3" />
        <path className="l-shade" d="M34 150 C34 104 56 84 80 80 C104 84 126 104 126 150 Z" />
        <path d="M47 144 C47 112 60 94 74 88" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="3" strokeLinecap="round" />
        <ellipse className="l-under" cx="80" cy="156" rx="44" ry="7" />
        <circle className="l-bulb" cx="80" cy="160" r="11" />
        <rect className="l-rim" x="30" y="148" width="100" height="8" rx="4" />
        <path ref={hitRef} className="l-hit" id="lHit" d="M80 170 L80 360" />
        <path ref={cordRef} className="l-chain" id="lCord" d="M80 170 L80 360" />
        <g ref={beadRef} id="lBead" className="l-pull" transform="translate(80 360)">
          <rect className="l-brass" x="-2" y="-14" width="4" height="8" rx="2" />
          <circle r="8" fill="url(#beadGrad)" stroke="#8f6f3a" strokeWidth="1.2" />
        </g>
      </svg>
    </button>
  );
}
