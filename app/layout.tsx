import type { Metadata } from "next";
import { Barlow_Condensed, IBM_Plex_Mono, Newsreader } from "next/font/google";
import { BRAND, SITE_URL } from "@/lib/site";
import "./globals.css";

const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-barlow",
  display: "swap",
});

const serif = Newsreader({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-newsreader",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `Video Game Stores Near You | ${BRAND}`,
    template: `%s | ${BRAND}`,
  },
  description:
    "Find physical video game shops near you. Compare hours, trade-ins, used games, retro stock, and which platforms each shop carries.",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${serif.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-screen bg-background text-foreground">{children}</body>
    </html>
  );
}
