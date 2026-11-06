import { StatusPanel } from "@/components/status-panel";

export function LoadError() {
  return (
    <StatusPanel
      title="This page could not be loaded"
      body="The store list did not come back. Please try again in a minute."
      actions={[
        { href: "/directory", label: "Back to stores" },
        { href: "/", label: "Home", tone: "ghost" },
      ]}
    />
  );
}
