"use client";

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@/components/theme-provider";

const AX = 80;
const AY = 164;
const LEN = 170;

type CordMotion = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  dragging: boolean;
  tx: number;
  ty: number;
};

type PointerStart = {
  startX: number;
  startY: number;
  moved: boolean;
  fired: boolean;
};

export function LampThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [portalReady, setPortalReady] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const lampRef = useRef<HTMLButtonElement>(null);
  const cordRef = useRef<SVGPathElement>(null);
  const hitRef = useRef<SVGPathElement>(null);
  const beadRef = useRef<SVGGElement>(null);
  const flickerTimer = useRef<number | null>(null);
  const hintTimer = useRef<number | null>(null);
  const animationFrame = useRef<number | null>(null);
  const animateRef = useRef<(() => void) | null>(null);
  const motion = useRef<CordMotion>({
    x: 0, y: 0, vx: 0, vy: 0, dragging: false, tx: 0, ty: 0,
  });
  const pointer = useRef<PointerStart | null>(null);

  useEffect(() => {
    setPortalReady(true);

    let alreadySeen = false;
    try {
      alreadySeen = window.localStorage.getItem("sm-studios-lamp-hint-seen") === "1";
      if (!alreadySeen) window.localStorage.setItem("sm-studios-lamp-hint-seen", "1");
    } catch {
      // The hint remains available for this visit when storage is unavailable.
    }

    if (!alreadySeen) {
      setShowHint(true);
      hintTimer.current = window.setTimeout(() => setShowHint(false), 3000);
    }

    return () => {
      if (hintTimer.current !== null) window.clearTimeout(hintTimer.current);
    };
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

    const stop = () => {
      if (animationFrame.current !== null) {
        window.cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
      }
    };

    const frame = () => {
      const state = motion.current;
      if (state.dragging) {
        state.x += (state.tx - state.x) * 0.38;
        state.y += (state.ty - state.y) * 0.38;
        state.vx = 0;
        state.vy = 0;
      } else {
        state.vx = (state.vx - state.x * 0.085) * 0.84;
        state.vy = (state.vy - state.y * 0.095) * 0.84;
        state.x += state.vx;
        state.y += state.vy;
      }

      draw();
      const settled =
        Math.abs(state.x) < 0.12 &&
        Math.abs(state.y) < 0.12 &&
        Math.abs(state.vx) < 0.12 &&
        Math.abs(state.vy) < 0.12;

      if (!state.dragging && settled) {
        state.x = 0;
        state.y = 0;
        state.vx = 0;
        state.vy = 0;
        draw();
        animationFrame.current = null;
        return;
      }

      animationFrame.current = window.requestAnimationFrame(frame);
    };

    const start = () => {
      if (reduceMotion || document.hidden || animationFrame.current !== null) return;
      animationFrame.current = window.requestAnimationFrame(frame);
    };

    animateRef.current = start;
    draw();

    const onVisibilityChange = () => {
      if (document.hidden) {
        stop();
      } else if (motion.current.dragging ||
        Math.abs(motion.current.x) > 0.12 ||
        Math.abs(motion.current.y) > 0.12) {
        start();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (flickerTimer.current !== null) window.clearTimeout(flickerTimer.current);
      animateRef.current = null;
    };
  }, []);

  const switchTheme = () => {
    const bounds = lampRef.current?.getBoundingClientRect();
    toggleTheme(bounds
      ? { x: bounds.left + bounds.width / 2, y: bounds.top + 48 }
      : undefined);

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
    if (event.button !== 0 && event.pointerType === "mouse") return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointer.current = {
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      fired: false,
    };
    motion.current.dragging = true;
    motion.current.tx = 0;
    motion.current.ty = 0;
    lampRef.current?.classList.add("grabbing");
    animateRef.current?.();
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const state = pointer.current;
    if (!state) return;
    if (event.cancelable) event.preventDefault();

    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    motion.current.tx = Math.max(-25, Math.min(25, dx * 0.6));
    motion.current.ty = Math.max(0, Math.min(60, dy));

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) state.moved = true;
    if (motion.current.ty >= 30 && !state.fired) {
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
      motion.current.vy = 5;
    } else if (state.fired) {
      motion.current.vy = -2.5;
    }

    motion.current.tx = 0;
    motion.current.ty = 0;
    animateRef.current?.();

    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Pointer capture may already have been released by the browser.
    }
  }

  function handleKeyboardClick(event: MouseEvent<HTMLButtonElement>) {
    if (event.detail === 0) switchTheme();
  }

  return portalReady && typeof document !== "undefined"
    ? createPortal(
      <div className="lamp-viewport" aria-hidden="false">
        <button
          ref={lampRef}
          className="lamp"
          id="lamp"
          type="button"
          role="switch"
          aria-label={theme === "dark" ? "Dark mode" : "Light mode"}
          aria-checked={theme === "dark"}
          title={theme === "dark"
            ? "Tap the shade or pull the chain to turn the light on"
            : "Tap the shade or pull the chain to turn the light off"}
          onClick={handleKeyboardClick}
        >
          {showHint && <span className="lamp-tooltip" role="status">Light / Dark</span>}
          <svg
            id="lampSvg"
            viewBox="0 0 160 380"
            aria-hidden="true"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <defs>
              <linearGradient id="shadeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#8F6F3A" />
                <stop offset=".35" stopColor="#E2C48A" />
                <stop offset=".7" stopColor="#C9A46B" />
                <stop offset="1" stopColor="#8F6F3A" />
              </linearGradient>
              <radialGradient id="beadGrad" cx=".3" cy=".25" r=".85">
                <stop offset="0" stopColor="#F6E2B0" />
                <stop offset="1" stopColor="#D9B878" />
              </radialGradient>
            </defs>
            <path className="l-brass" d="M60 0 H100 L93 12 H67 Z" />
            <line className="l-wire" x1="80" y1="12" x2="80" y2="62" />
            <rect className="l-brass l-cap" x="70" y="60" width="20" height="15" rx="3" />
            <path className="l-shade" d="M36 146 C36 104 56 84 80 80 C104 84 124 104 124 146 Z" />
            <path className="l-hl" d="M49 140 C49 112 62 95 76 89" />
            <ellipse className="l-under" cx="80" cy="154" rx="46" ry="7" />
            <circle className="l-bulb" cx="80" cy="157" r="10" />
            <rect className="l-rim" x="32" y="144" width="96" height="8" rx="4" />
            <path ref={hitRef} className="l-hit" id="lHit" d="M80 164 L80 334" />
            <path ref={cordRef} className="l-chain" id="lCord" d="M80 164 L80 334" />
            <g ref={beadRef} id="lBead" className="l-pull" transform="translate(80 334)">
              <rect className="l-brass l-bead-neck" x="-2" y="-14" width="4" height="8" rx="2" />
              <circle className="l-bead-sphere" r="8.5" />
            </g>
          </svg>
        </button>
      </div>,
      document.body,
    )
    : null;
}
