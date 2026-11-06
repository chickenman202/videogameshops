import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { BRAND, SITE_URL } from "@/lib/site";
import "./globals.css";

const sans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-source",
  display: "swap",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `Video Game Stores Near You | ${BRAND}`,
    template: `%s | ${BRAND}`,
  },
  description:
    "Find physical video game stores in the United States. Compare hours, trade-ins, used games, retro stock, and which platforms each shop carries.",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-screen bg-background text-foreground">{children}</body>
    </html>
  );
}
