"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { currencyLabel } from "@/data/catalog";
import {
  CART_EVENT,
  clearCart,
  readCart,
  removeFromCart,
  updateCartQuantity,
  type CartItem,
} from "@/lib/shop-storage";
import { ScrollReveal } from "@/components/scroll-reveal";
import { MotionButton } from "@/components/motion-button";

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [error, setError] = useState("");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const sync = () => setItems(readCart());
    sync();
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function update(action: () => CartItem[]) {
    try {
      setItems(action());
      setError("");
    } catch (storageError) {
      setError(storageError instanceof Error ? storageError.message : "Your selection could not be updated.");
    }
  }

  return (
    <div className="page-shell">
      <ScrollReveal className="page-hero" variant="fadeDown">
        <span className="eyebrow">YOUR SELECTION</span>
        <h1>Saved <em>pieces.</em></h1>
        <p>Keep a shortlist here, then complete each purchase securely on Etsy.</p>
      </ScrollReveal>

      <div className="cart-panel glass-surface">
        <AnimatePresence initial={false}>
          {error && <m.p className="form-note" role="alert" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}}>{error}</m.p>}
        </AnimatePresence>
        {items.length ? (
          <>
            <m.div
              className="selection-list"
              initial={reduceMotion ? false : "hidden"}
              whileInView={reduceMotion ? undefined : "visible"}
              viewport={{once:true,amount:0.1}}
              variants={{hidden:{opacity:0,y:8},visible:{opacity:1,y:0,transition:{duration:.3}}}}
            >
              <AnimatePresence initial={false}>
              {items.map((item) => (
                <m.article
                  className="selection-line glass-surface glass-surface--interactive"
                  key={item.id}
                  initial={reduceMotion ? false : {opacity:0,y:12}}
                  animate={{opacity:1,y:0}}
                  exit={reduceMotion ? undefined : {opacity:0,y:-6}}
                  transition={{duration:reduceMotion ? 0 : .22}}
                >
                  <Link href={`/shop/${item.slug}`} className="selection-image">
                    {item.image && <Image src={item.image} alt="" fill sizes="96px" className="object-cover" />}
                    <span className="sr-only">View {item.title}</span>
                  </Link>
                  <div className="selection-details">
                    <h2>{item.title}</h2>
                    <p>{currencyLabel(item.price, item.currency || "USD")}</p>
                    <div className="selection-quantity">
                      <MotionButton type="button" aria-label={`Remove one ${item.title}`} onClick={() => update(() => updateCartQuantity(item.id, item.qty - 1))}>−</MotionButton>
                      <span>{item.qty} saved</span>
                      <MotionButton type="button" aria-label={`Add one ${item.title}`} onClick={() => update(() => updateCartQuantity(item.id, item.qty + 1))}>+</MotionButton>
                    </div>
                  </div>
                  <div className="selection-actions">
                    <a className="btn btn-dark" href={item.url} target="_blank" rel="noopener noreferrer">
                      CONTINUE ON ETSY
                    </a>
                    <MotionButton className="remove-selection" type="button" onClick={() => update(() => removeFromCart(item.id))}>REMOVE</MotionButton>
                  </div>
                </m.article>
              ))}
              </AnimatePresence>
            </m.div>
            <ScrollReveal className="selection-footer glass-surface--subtle">
              <p>Each item is purchased separately on Etsy. Prices, options, shipping and availability are confirmed there.</p>
              <MotionButton type="button" className="btn btn-outline-dark" onClick={() => update(clearCart)}>CLEAR SELECTION</MotionButton>
            </ScrollReveal>
          </>
        ) : (
          <ScrollReveal className="empty-catalog compact">
            <span aria-hidden="true"></span>
            <h2>Your selection<br /><em>is waiting for art.</em></h2>
            <p>Save a piece from its detail page. There is no website checkout or payment collection.</p>
            <Link className="btn btn-dark" href="/shop">EXPLORE THE SHOP</Link>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}
