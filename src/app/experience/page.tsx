import type { Metadata } from "next";
import { ExperienceClient } from "@/components/experience/experience-client";

export const metadata: Metadata = {
  title: "The Quiet Garden — An Immersive Experience | THE SM STUDIOS",
  description:
    "Explore The Quiet Garden, an original immersive storytelling experience by THE SM STUDIOS. Five chapters. One quiet journey.",
};

export default function ExperiencePage() {
  return <ExperienceClient />;
}
