"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { staggerContainer, staggerItem } from "@/animations/variants";
import { MotionButton } from "@/components/motion-button";
import { ScrollReveal } from "@/components/scroll-reveal";

export default function Contact() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const reduceMotion = useReducedMotion();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      subject: String(formData.get("subject") || ""),
      message: String(formData.get("message") || ""),
      website: String(formData.get("website") || ""),
    };

    setStatus("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Message could not be sent");
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  const notice =
    status === "sent"
      ? "Thank you for reaching out. Your message has been sent to the studio."
      : status === "error"
        ? "We couldn't send your message right now. Please try again shortly."
        : status === "sending"
          ? "Sending your message…"
          : "";

  return (
    <div className="page-shell contact-page">
      <ScrollReveal className="page-hero" variant="fadeDown">
        <span className="eyebrow">START A CONVERSATION</span>
        <h1>Let&apos;s create a<br /><em>connection.</em></h1>
        <p>Whether you&apos;re enquiring about an artwork, an order, or a creative collaboration, we&apos;d love to hear from you.</p>
      </ScrollReveal>

      <m.form
        className="contact-form contact-form-premium"
        onSubmit={handleSubmit}
        initial={reduceMotion ? false : "hidden"}
        whileInView={reduceMotion ? undefined : "visible"}
        viewport={{ once: true, amount: 0.15 }}
        variants={staggerContainer}
      >
        <m.label variants={reduceMotion ? undefined : staggerItem}>
          YOUR NAME
          <input name="name" autoComplete="name" required maxLength={100} placeholder="Your name" />
        </m.label>
        <m.label variants={reduceMotion ? undefined : staggerItem}>
          EMAIL ADDRESS
          <input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" />
        </m.label>
        <m.label variants={reduceMotion ? undefined : staggerItem}>
          SUBJECT
          <input name="subject" required maxLength={150} placeholder="How can we help?" />
        </m.label>
        <m.label variants={reduceMotion ? undefined : staggerItem}>
          YOUR MESSAGE
          <textarea name="message" required maxLength={5000} rows={5} placeholder="Write your message..." />
        </m.label>
        <div aria-hidden="true" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0, 0, 0, 0)" }}>
          <label>Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" /></label>
        </div>
        <m.div variants={reduceMotion ? undefined : staggerItem}>
          <MotionButton type="submit" className="btn btn-dark" disabled={status === "sending"}>
            {status === "sending" ? "SENDING..." : "SEND YOUR MESSAGE"}
          </MotionButton>
        </m.div>
        <AnimatePresence initial={false}>
          {notice && (
            <m.p
              key={status}
              className="form-note"
              role="status"
              aria-live="polite"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
            >
              {notice}
            </m.p>
          )}
        </AnimatePresence>
      </m.form>
    </div>
  );
}
