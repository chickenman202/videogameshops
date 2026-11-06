import { PageShell } from "@/components/page-shell";

export function LoadError() {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="text-4xl font-semibold tracking-tight">This page could not be loaded</h1>
        <p className="mt-4 text-lg text-muted">
          The store list did not come back. Please try again in a minute.
        </p>
        <a href="/directory" className="mt-8 inline-flex rounded-full bg-[#155eef] px-5 py-2.5 text-sm font-medium text-white">
          Back to stores
        </a>
      </div>
    </PageShell>
  );
}
