import type { Metadata } from "next";
import { StatusPanel } from "@/components/status-panel";

export const metadata: Metadata = {
  title: { absolute: "Page Not Found" },
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <StatusPanel
      title="Page Not Found"
      body="That page isn’t here. Try a city, a country, or a shop name."
      actions={[
        { href: "/directory", label: "All stores" },
        { href: "/contact", label: "Contact", tone: "ghost" },
      ]}
    />
  );
}
