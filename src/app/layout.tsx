
import type { Metadata } from "next";
import "./globals.css";
import "./home.css";
import "./theme.css";
import { SiteShell } from "@/components/site-shell";
import { AnimationProvider } from "@/components/animation-provider";

export const metadata: Metadata = {
  title: "THE SM STUDIOS — From Activism to Art",
  description: "Meaningful artwork, expressive designs, and creative pieces inspired by culture, identity, and imagination."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AnimationProvider>
          <SiteShell>{children}</SiteShell>
        </AnimationProvider>
      </body>
    </html>
  );
}
