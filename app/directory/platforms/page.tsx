import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LoadError } from "@/components/load-error";
import { PageShell } from "@/components/page-shell";
import { loadCatalog } from "@/lib/catalog";
import { FIXTURE_SHOPS } from "@/lib/fixture-shops";
import { toMetaDescription, toTitle } from "@/lib/copy";
import { absoluteUrl } from "@/lib/jsonld";
import { platformPath } from "@/lib/paths";
import { platformHeading, PLATFORMS } from "@/lib/platforms";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: toTitle("Video Game Stores by Platform") },
  description: toMetaDescription(
    "Video game stores by what they carry: PlayStation, Xbox, Nintendo, PC, handheld, retro, and VR.",
  ),
  alternates: { canonical: absoluteUrl("/directory/platforms") },
};

export default async function PlatformsPage() {
  const catalog = await loadCatalog();
  if (!catalog.ok) return <LoadError />;

  const shops = catalog.stores.length === 0 ? FIXTURE_SHOPS : catalog.stores;
  const platforms = PLATFORMS.map((platform) => ({
    ...platform,
    count: shops.filter((store) => store.platforms.includes(platform.label)).length,
  })).filter((platform) => platform.count > 0);

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <Breadcrumbs
          crumbs={[{ name: "Home", href: "/" }, { name: "Stores", href: "/directory" }, { name: "Platforms" }]}
        />
        <h1 className="mt-4 text-5xl uppercase text-ink sm:text-7xl">Video Game Stores by Platform</h1>
        <p className="mt-3 max-w-3xl text-lg text-ink-soft">
          Shops grouped by the platforms their listings name: PlayStation, retro, and the rest.
        </p>
        {platforms.length > 0 ? (
          <ul className="mt-8 border-t border-ink">
            {platforms.map((platform) => (
              <li key={platform.slug} className="border-b border-line">
                <a href={platformPath(platform.slug)} className="block py-4 hover:text-blue-ink">
                  <span className="font-display text-3xl font-bold uppercase text-ink">{platformHeading(platform.label)}</span>
                  <span className="mt-2 block kicker text-ink">
                    {platform.count.toLocaleString("en-US")} {platform.count === 1 ? "store" : "stores"}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8 border-t border-ink py-8">
            <p className="text-ink-soft">No platforms have shops yet.</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link href="/directory" className="btn btn-primary">
                All stores
              </Link>
              <Link href="/submit" className="btn btn-ghost">
                Add a store
              </Link>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
