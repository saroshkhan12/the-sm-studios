import type { Transition, Variants } from "framer-motion";

export const easeOutTransition: Transition = {
  duration: 0.48,
  ease: [0.22, 1, 0.36, 1],
};

export const quickTransition: Transition = {
  duration: 0.2,
  ease: [0.22, 1, 0.36, 1],
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: easeOutTransition },
  exit: { opacity: 0, transition: quickTransition },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: easeOutTransition },
  exit: { opacity: 0, y: -6, transition: quickTransition },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -14 },
  visible: { opacity: 1, y: 0, transition: easeOutTransition },
  exit: { opacity: 0, y: -6, transition: quickTransition },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -18 },
  visible: { opacity: 1, x: 0, transition: easeOutTransition },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 18 },
  visible: { opacity: 1, x: 0, transition: easeOutTransition },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1, transition: easeOutTransition },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.075, delayChildren: 0.04 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: quickTransition },
};

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 7 },
  visible: { opacity: 1, y: 0, transition: quickTransition },
  exit: { opacity: 0, y: -5, transition: { duration: 0.14 } },
};
