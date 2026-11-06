import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LoadError } from "@/components/load-error";
import { PageShell } from "@/components/page-shell";
import { loadCatalog } from "@/lib/catalog";
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
  retro: "Retro is a platform tag, not a separate switch.",
  vr: "Shops that carry VR games",
};

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
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <Breadcrumbs
          crumbs={[{ name: "Home", href: "/" }, { name: "Stores", href: "/directory" }, { name: "Platforms" }]}
        />
        <h1 className="mt-4 text-3xl text-balance text-ink sm:text-5xl">Video Game Stores by Platform</h1>
        <p className="mt-3 max-w-3xl text-lg text-ink-soft">
          A platform page lists only stores that carry that platform. Retro is a platform tag, not a separate switch.
        </p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {platforms.map((platform) => (
            <li key={platform.slug}>
              <a
                href={platformPath(platform.slug)}
                className="flex h-full flex-col rounded-2xl border border-line bg-card p-5 shadow-card hover:border-pine"
              >
                <span className="font-display text-2xl font-semibold text-ink">{platformHeading(platform.label)}</span>
                <span className="mt-2 flex-1 text-sm leading-relaxed text-muted">{notes[platform.slug]}</span>
                <span className="mt-4 text-sm font-semibold text-ink">
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
