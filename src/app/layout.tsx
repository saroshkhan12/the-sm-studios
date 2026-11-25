
import type { Metadata } from "next";
import "./globals.css";
import "./home.css";
import "./theme.css";
import { SiteShell } from "@/components/site-shell";
import { AnimationProvider } from "@/components/animation-provider";
import { ThemeProvider } from "@/components/theme-provider";

const themeInitScript = `(() => { try { const saved = localStorage.getItem("sm-studios-theme"); const theme = saved === "light" || saved === "dark" ? saved : (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"); const root = document.documentElement; root.dataset.theme = theme; root.style.colorScheme = theme; } catch (_) { document.documentElement.dataset.theme = "dark"; document.documentElement.style.colorScheme = "dark"; } })();`;

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
