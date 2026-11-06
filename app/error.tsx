"use client";

import { StatusPanel } from "@/components/status-panel";

export default function RouteError({
  reset,
}: {
  error: globalThis.Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <StatusPanel
      title="The directory did not load"
      body="The shop list did not come back. Try again in a minute."
      actions={[{ href: "/directory", label: "Back to stores", tone: "ghost" }]}
    >
      <button type="button" className="btn btn-primary" onClick={() => reset()}>
        Try again
      </button>
    </StatusPanel>
  );
}
