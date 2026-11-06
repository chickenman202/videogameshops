import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BRAND, SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-screen bg-background text-foreground">{children}</body>
    </html>
  );
}
