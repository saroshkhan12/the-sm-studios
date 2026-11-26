import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Quiet Garden — THE SM STUDIOS",
  description:
    "An immersive, original journey through a quiet garden shaped by light, stone and time.",
};

export default function ExperiencePage() {
  return (
    <section
      aria-label="THE SM STUDIOS immersive experience"
      style={{ width: "100%", minHeight: "100svh", background: "#111512" }}
    >
      <iframe
        src="/experience/index.html"
        title="THE SM STUDIOS — The Quiet Garden immersive experience"
        allow="fullscreen; accelerometer; gyroscope"
        loading="eager"
        referrerPolicy="strict-origin-when-cross-origin"
        style={{
          display: "block",
          width: "100%",
          height: "100svh",
          minHeight: "640px",
          border: 0,
          background: "#111512",
        }}
      />
    </section>
  );
}
