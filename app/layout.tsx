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
  style: ["normal", "italic"],
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
    "Find physical video game stores by country, region, and city. Hours and contact details appear when a listing has them.",
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${serif.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-screen bg-background text-foreground">{children}</body>
    </html>
  );
}
