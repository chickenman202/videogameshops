import { StatusPanel } from "@/components/status-panel";

export function LoadError() {
  return (
    <StatusPanel
      title="The shop list didn’t load"
      body="Give it a minute, then try again."
      actions={[
        { href: "/directory", label: "Back to stores" },
        { href: "/", label: "Home", tone: "ghost" },
      ]}
    />
  );
}
