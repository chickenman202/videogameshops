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
      title="The shop list didn’t load"
      body="Give it a minute, then try again."
      actions={[{ href: "/directory", label: "Back to stores", tone: "ghost" }]}
    >
      <button type="button" className="btn btn-primary" onClick={() => reset()}>
        Try again
      </button>
    </StatusPanel>
  );
}
