"use client";

import { useCallback, useRef, type KeyboardEvent, type PointerEvent } from "react";

export type SwipeDirection = "next" | "previous";

type SwipeStart = {
  pointerId: number;
  x: number;
  y: number;
};

export function useSwipeNavigation(
  onSwipe: (direction: SwipeDirection) => void,
  threshold = 44,
) {
  const start = useRef<SwipeStart | null>(null);

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" || event.button !== 0) return;

    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select, [data-no-swipe]")) {
      return;
    }

    start.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
  }, []);

  const onPointerUp = useCallback((event: PointerEvent<HTMLElement>) => {
    const origin = start.current;
    start.current = null;
    if (!origin || origin.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - origin.x;
    const deltaY = event.clientY - origin.y;
    if (
      Math.abs(deltaX) < threshold ||
      Math.abs(deltaX) <= Math.abs(deltaY) * 1.2
    ) {
      return;
    }

    onSwipe(deltaX < 0 ? "next" : "previous");
  }, [onSwipe, threshold]);

  const onPointerCancel = useCallback(() => {
    start.current = null;
  }, []);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select")) return;

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      onSwipe(event.key === "ArrowRight" ? "next" : "previous");
    }
  }, [onSwipe]);

  return {
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    onKeyDown,
  };
}
