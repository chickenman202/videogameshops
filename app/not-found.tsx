import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: { absolute: "Page Not Found" },
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="text-4xl font-semibold tracking-tight">Page Not Found</h1>
        <p className="mt-4 text-lg text-muted">That page is not in the directory.</p>
        <a href="/directory" className="mt-8 inline-flex rounded-full bg-[#155eef] px-5 py-2.5 text-sm font-medium text-white">
          Browse stores
        </a>
      </div>
    </PageShell>
  );
}
