"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export function ExperienceClient() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let active = true;
    let cleanup: (() => void) | undefined;

    void import("./experience-engine").then(({ mountExperience }) => {
      if (active) cleanup = mountExperience(root);
    }).catch((error) => {
      console.error("The immersive experience could not be initialized.", error);
      const fallback = root.querySelector<HTMLElement>("#fallback");
      if (fallback) fallback.hidden = false;
    });

    return () => {
      active = false;
      cleanup?.();
    };
  }, []);

  return (
    <div className="sm-experience" ref={rootRef} aria-label="The Quiet Garden immersive experience">
      <div id="scene" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <div className="experience-controls">
        <span>THE SM STUDIOS <i>—</i> THE QUIET GARDEN</span>
        <button className="sound-toggle" id="motion-toggle" type="button" aria-pressed="false">
          PAUSE MOTION
        </button>
      </div>
      <main className="experience-story">
        <section className="chapter chapter--hero" id="arrival" data-chapter="0">
          <div className="eyebrow">FIELD NOTE 001 <span>—</span> THE QUIET GARDEN</div>
          <h1>A quiet place<br /><em>between worlds.</em></h1>
          <p className="intro">A passage through stone, shadow and the small light that remains.</p>
          <a className="enter-link" href="#threshold"><span>BEGIN THE WALK</span><i aria-hidden="true">↘</i></a>
          <div className="hero-index">01 <span>/</span> 05</div>
        </section>
        <section className="chapter chapter--side" id="threshold" data-chapter="1">
          <div className="chapter-copy">
            <div className="eyebrow">CHAPTER 01 <span>—</span> THE THRESHOLD</div>
            <h2>Leave the noise<br /><em>at the edge.</em></h2>
            <p>Beyond the garden wall, the path narrows. The world asks for less of you here. Take only the time you need.</p>
            <span className="chapter-note">A PLACE TO ARRIVE</span>
          </div>
          <div className="chapter-number">01</div>
        </section>
        <section className="chapter chapter--side chapter--right" id="water" data-chapter="2">
          <div className="chapter-copy">
            <div className="eyebrow">CHAPTER 02 <span>—</span> THE STILL WATER</div>
            <h2>Even silence<br /><em>has a surface.</em></h2>
            <p>Rain gathers in the basin. Each circle travels outward, touches another, and disappears without asking to be remembered.</p>
            <span className="chapter-note">A STUDY IN REFLECTION</span>
          </div>
          <div className="chapter-number">02</div>
        </section>
        <section className="chapter chapter--side" id="lantern" data-chapter="3">
          <div className="chapter-copy">
            <div className="eyebrow">CHAPTER 03 <span>—</span> THE LAST LIGHT</div>
            <h2>Small lights<br /><em>are enough.</em></h2>
            <p>As evening settles, a warm glow marks the way. It does not reveal everything. It simply makes the next step possible.</p>
            <span className="chapter-note">A STUDY IN WARMTH</span>
          </div>
          <div className="chapter-number">03</div>
        </section>
        <section className="chapter chapter--final" id="return" data-chapter="4">
          <div className="eyebrow">CHAPTER 04 <span>—</span> THE RETURN</div>
          <h2>Carry the quiet<br /><em>with you.</em></h2>
          <p>The garden remains where it is. What changes is the pace at which you leave it.</p>
          <div className="experience-return-links">
            <Link className="enter-link" href="/"><span>RETURN TO THE STUDIO</span><i aria-hidden="true">↗</i></Link>
            <Link className="enter-link" href="/collections"><span>EXPLORE THE COLLECTION</span><i aria-hidden="true">↗</i></Link>
          </div>
          <div className="closing-mark">THE SM STUDIOS <span>—</span> FROM ACTIVISM TO ART</div>
        </section>
      </main>
      <nav className="chapter-nav" aria-label="Journey chapters">
        <a href="#arrival" className="is-active" aria-label="Arrival" aria-current="location"><span /></a>
        <a href="#threshold" aria-label="The threshold"><span /></a>
        <a href="#water" aria-label="Still water"><span /></a>
        <a href="#lantern" aria-label="Last light"><span /></a>
        <a href="#return" aria-label="The return"><span /></a>
      </nav>
      <div className="scroll-cue" aria-hidden="true">SCROLL TO MOVE <span>↓</span></div>
      <div className="webgl-fallback" id="fallback" hidden>
        <p>Your browser could not start the 3D scene. The story remains available in this simplified view.</p>
      </div>
    </div>
  );
}
