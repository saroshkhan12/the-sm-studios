"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { staggerContainer, staggerItem } from "@/animations/variants";
import { MotionButton } from "@/components/motion-button";
import { ScrollReveal } from "@/components/scroll-reveal";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <div className="page-shell contact-page">
      <ScrollReveal className="page-hero" variant="fadeDown">
        <span className="eyebrow">START A CONVERSATION</span>
        <h1>Let&apos;s create a<br /><em>connection.</em></h1>
        <p>Whether you&apos;re enquiring about an artwork, an order, or a creative collaboration, we&apos;d love to hear from you.</p>
      </ScrollReveal>

      <m.form
        className="contact-form contact-form-premium"
        onSubmit={(event) => {
          event.preventDefault();
          setSent(true);
        }}
        initial={reduceMotion ? false : "hidden"}
        whileInView={reduceMotion ? undefined : "visible"}
        viewport={{ once: true, amount: 0.15 }}
        variants={staggerContainer}
      >
        <m.label variants={reduceMotion ? undefined : staggerItem}>
          YOUR NAME
          <input name="name" autoComplete="name" required placeholder="Your name" />
        </m.label>
        <m.label variants={reduceMotion ? undefined : staggerItem}>
          EMAIL ADDRESS
          <input name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        </m.label>
        <m.label variants={reduceMotion ? undefined : staggerItem}>
          SUBJECT
          <input name="subject" required placeholder="How can we help?" />
        </m.label>
        <m.label variants={reduceMotion ? undefined : staggerItem}>
          YOUR MESSAGE
          <textarea name="message" required rows={5} placeholder="Write your message..." />
        </m.label>
        <m.div variants={reduceMotion ? undefined : staggerItem}>
          <MotionButton type="submit" className="btn btn-dark">SEND YOUR MESSAGE</MotionButton>
        </m.div>
        <AnimatePresence initial={false}>
          {sent && (
            <m.p
              key="contact-response"
              className="form-note"
              role="status"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
            >
              Thanks for reaching out. This demo form is not connected to email yet; connect a mail service before launch.
            </m.p>
          )}
        </AnimatePresence>
      </m.form>
    </div>
  );
}
