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

const notes: Record<string, string> = {
  playstation: "Shops that carry PlayStation games",
  xbox: "Shops that carry Xbox games",
  nintendo: "Shops that carry Nintendo games",
  pc: "Shops that carry PC games",
  handheld: "Shops that carry handheld games",
  retro: "Shops tagged for older games and consoles.",
  vr: "Shops that carry VR games",
};

export const metadata: Metadata = {
  title: { absolute: toTitle("Video Game Stores by Platform") },
  description: toMetaDescription(
    "Physical video game shops by what they carry: PlayStation, Xbox, Nintendo, PC, handheld, retro, and VR.",
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
          Each list is the shops that carry that platform. A shop appears only when the listing names it.
        </p>
        {platforms.length > 0 ? (
          <ul className="mt-8 border-t border-ink">
            {platforms.map((platform) => (
              <li key={platform.slug} className="border-b border-line">
                <a href={platformPath(platform.slug)} className="block py-4 hover:text-blue-ink">
                  <span className="font-display text-3xl font-bold uppercase text-ink">{platformHeading(platform.label)}</span>
                  <span className="mt-1 block text-sm text-muted">{notes[platform.slug]}</span>
                  <span className="mt-2 block kicker text-ink">
                    {platform.count.toLocaleString("en-US")} {platform.count === 1 ? "store" : "stores"}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8 border-t border-ink py-8">
            <p className="text-ink-soft">No platform has shops listed.</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link href="/directory" className="btn btn-primary">
                All stores
              </Link>
              <Link href="/submit" className="btn btn-ghost">
                Submit a store
              </Link>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
