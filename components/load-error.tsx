import { StatusPanel } from "@/components/status-panel";

export function LoadError() {
  return (
    <StatusPanel
      title="The directory did not load"
      body="The shop list did not come back. Try again in a minute."
      actions={[
        { href: "/directory", label: "Back to stores" },
        { href: "/", label: "Home", tone: "ghost" },
      ]}
    />
  );
}
