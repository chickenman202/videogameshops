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
      body="That page is not in the directory. Search for a city or a shop name."
      actions={[
        { href: "/directory", label: "Browse stores" },
        { href: "/directory/states", label: "Browse states", tone: "ghost" },
      ]}
    />
  );
}
