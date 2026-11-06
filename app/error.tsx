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
      title="This page could not be loaded"
      body="The store list did not come back. Please try again in a minute."
      actions={[{ href: "/directory", label: "Back to stores", tone: "ghost" }]}
    >
      <button type="button" className="btn btn-primary" onClick={() => reset()}>
        Try again
      </button>
    </StatusPanel>
  );
}
