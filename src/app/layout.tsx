
import type { Metadata } from "next";
import "./globals.css";
import "./home.css";
import "./theme.css";
import { SiteShell } from "@/components/site-shell";
import { AnimationProvider } from "@/components/animation-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://smstudios.khansproduction.pk"),
  applicationName: "THE SM STUDIOS",
  title: {
    default: "THE SM STUDIOS — From Activism to Art",
    template: "%s | THE SM STUDIOS",
  },
  description:
    "Meaningful artwork, expressive designs, and creative pieces inspired by culture, identity, and imagination.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "THE SM STUDIOS",
    title: "THE SM STUDIOS — From Activism to Art",
    description:
      "Meaningful artwork, expressive designs, and creative pieces inspired by culture, identity, and imagination.",
    url: "https://smstudios.khansproduction.pk",
  },
  twitter: {
    card: "summary_large_image",
    title: "THE SM STUDIOS — From Activism to Art",
    description:
      "Meaningful artwork, expressive designs, and creative pieces inspired by culture, identity, and imagination.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
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
