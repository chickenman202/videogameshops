import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LoadError } from "@/components/load-error";
import { PageShell } from "@/components/page-shell";
import { loadCatalog } from "@/lib/catalog";
import { toMetaDescription, toTitle } from "@/lib/copy";
import { breadcrumbJsonLd, JsonLd, placeListJsonLd } from "@/lib/jsonld";
import { platformPath } from "@/lib/paths";
import { platformHeading, PLATFORMS } from "@/lib/platforms";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 86400;

const title = toTitle("Video Game Stores by Platform");
const description = toMetaDescription(
  "Browse video game stores by platform: PlayStation, Xbox, Nintendo, PC, handheld, retro, and VR.",
);

export const metadata: Metadata = pageMetadata({
  title,
  description,
  canonicalPath: "/directory/platforms",
});

export default async function PlatformsPage() {
  const catalog = await loadCatalog();
  if (!catalog.ok) return <LoadError />;

  const platforms = PLATFORMS.map((platform) => ({
    ...platform,
    count: catalog.stores.filter((store) => store.platforms.includes(platform.label)).length,
  }));

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Platforms", path: "/directory/platforms" },
  ];
  const listed = platforms.filter((platform) => platform.count > 0);

  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd
        data={placeListJsonLd({
          name: "Video Game Stores by Platform",
          path: "/directory/platforms",
          places: listed.map((platform) => ({
            name: platformHeading(platform.label),
            path: platformPath(platform.slug),
          })),
        })}
      />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <Breadcrumbs crumbs={crumbs.map((crumb) => ({ name: crumb.name, href: crumb.path }))} />
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Video Game Stores by Platform</h1>
        <p className="mt-4 max-w-3xl text-lg text-muted">
          A platform page lists only stores that carry that platform. Retro is a platform tag, not a separate switch.
        </p>
        {listed.length === 0 ? (
          <p className="mt-8 text-[#3c4550]">Platform pages appear when a listed shop carries that platform.</p>
        ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listed.map((platform) => (
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
        )}
      </div>
    </PageShell>
  );
}
