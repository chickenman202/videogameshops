import type { Metadata } from "next";
import { LoadError } from "@/components/load-error";
import { PageShell } from "@/components/page-shell";
import { loadCatalog } from "@/lib/catalog";
import { toMetaDescription, toTitle } from "@/lib/copy";
import { absoluteUrl } from "@/lib/jsonld";
import { platformPath } from "@/lib/paths";
import { platformHeading, PLATFORMS } from "@/lib/platforms";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: toTitle("Video Game Stores by Platform") },
  description: toMetaDescription(
    "Browse video game stores by platform: PlayStation, Xbox, Nintendo, PC, handheld, retro, and VR.",
  ),
  alternates: { canonical: absoluteUrl("/directory/platforms") },
};

export default async function PlatformsPage() {
  const catalog = await loadCatalog();
  if (!catalog.ok) return <LoadError />;

  const platforms = PLATFORMS.map((platform) => ({
    ...platform,
    count: catalog.stores.filter((store) => store.platforms.includes(platform.label)).length,
  }));

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-4xl font-semibold tracking-tight">Video Game Stores by Platform</h1>
        <p className="mt-4 max-w-3xl text-lg text-muted">
          A platform page lists only stores that carry that platform. Retro is a platform tag, not a separate switch.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {platforms.map((platform) => (
            <li key={platform.slug}>
              <a
                href={platformPath(platform.slug)}
                className="block rounded-3xl border border-[#d5dbe3] bg-white p-5 hover:border-[#155eef]"
              >
                <span className="block text-xl font-semibold">{platformHeading(platform.label)}</span>
                <span className="mt-2 block text-sm text-muted">
                  {platform.count.toLocaleString("en-US")} {platform.count === 1 ? "store" : "stores"}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </PageShell>
  );
}
