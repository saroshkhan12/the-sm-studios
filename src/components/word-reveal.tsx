"use client";

import { m, useReducedMotion } from "framer-motion";

export function WordReveal({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const words = text.split(" ");

  return (
    <span className={className} aria-label={text}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="word-reveal-visual">
        {words.map((word, index) => (
          <m.span
            className="word-reveal-word"
            key={`${word}-${index}`}
            initial={reduceMotion ? false : { opacity: 0, y: 18, filter: "blur(7px)" }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.7 }}
            transition={{ duration: 0.55, delay: reduceMotion ? 0 : index * 0.075, ease: [0.22, 1, 0.36, 1] }}
          >
            {word}&nbsp;
          </m.span>
        ))}
      </span>
    </span>
  );
}
