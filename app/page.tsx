import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { SearchForm } from "@/components/search-form";
import { SiteHeader } from "@/components/site-header";
import { loadCatalog } from "@/lib/catalog";
import { countryLinks } from "@/lib/links";
import { homeJsonLd, JsonLd } from "@/lib/jsonld";
import { platformPath } from "@/lib/paths";
import { PLATFORMS } from "@/lib/platforms";
import { toMetaDescription, toTitle } from "@/lib/copy";
import { pageMetadata } from "@/lib/seo";
import { MIN_CITY_STORES } from "@/lib/site";
import { US_STATES } from "@/lib/states";

const description = toMetaDescription(
  "Find physical video game stores by country, region, and city.",
);

export const revalidate = 86400;

export const metadata: Metadata = pageMetadata({
  title: toTitle("Video Game Stores Near You"),
  description,
  canonicalPath: "/",
});

const facts = [
  {
    title: "A page for every shop",
    body: "Each listing names the shop and its country. A street, city, phone, website, or map point is shown when the listing includes it.",
  },
  {
    title: "Details that are on file",
    body: "Hours, platforms, trade-ins, and used games appear only when the listing includes them.",
  },
  {
    title: "Platforms that are listed",
    body: "PlayStation, Xbox, Nintendo, PC, handheld, retro, and VR appear for shops whose listing names them.",
  },
];

const questions = [
  {
    q: "What does a store page show?",
    a: "The details on file for that shop. A street, phone, website, or hours line is left off the page when the listing does not include it.",
  },
  {
    q: "Why does a small city not have its own roundup?",
    a: "A city roundup is for places with at least three stores. A town with one shop still has that store’s own page.",
  },
  {
    q: "How do I fix a wrong listing?",
    a: "Use the contact page. Include the store name, the city, and the correction. Public pages refresh within a day after the listing is updated.",
  },
];

export default async function HomePage() {
  const catalog = await loadCatalog();
  const count = catalog.ok ? catalog.stores.length : null;
  const states = catalog.ok
    ? US_STATES.map((state) => ({
        ...state,
        count: catalog.stores.filter(
          (store) => store.countryCode === "US" && store.stateSlug === state.slug,
        ).length,
      })).filter((state) => state.count >= MIN_CITY_STORES)
    : [];
  const countries = catalog.ok ? countryLinks(catalog.stores) : [];

  return (
    <PageShell header="none">
      <JsonLd data={homeJsonLd()} />
      <section className="relative bg-[#090b10] text-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(21,94,239,0.55),transparent_52%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_32%,rgba(255,255,255,0.16)_48%,transparent_64%)]" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-6">
          <SiteHeader tone="hero" />
          <div className="mx-auto max-w-3xl pt-16 text-center">
            <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm text-[#d5dbe3]">
              {count == null
                ? "The store count could not be loaded."
                : `${count.toLocaleString("en-US")} video game stores`}
            </p>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight text-balance md:text-6xl">
              Video game stores near you
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/75">
              Find physical video game stores by country, region, and city.
            </p>
          </div>
        </div>
      </section>
      <div className="relative z-10 mx-auto -mt-8 max-w-3xl px-4">
        <SearchForm />
      </div>

      <section className="mx-auto max-w-6xl px-4 pb-8 pt-12">
        <h2 className="text-3xl font-semibold tracking-tight">Browse by platform</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLATFORMS.map((platform) => (
            <a
              key={platform.slug}
              href={platformPath(platform.slug)}
              className="rounded-3xl border border-[#d5dbe3] bg-[linear-gradient(180deg,#ffffff,#eef1f5)] p-5 shadow-[0_8px_24px_rgba(9,11,16,0.04)] hover:border-[#155eef]"
            >
              <span className="block text-lg font-semibold">{platform.label}</span>
              <span className="mt-2 block text-sm text-muted">Open the {platform.label} list</span>
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-8 md:grid-cols-3">
        {facts.map((fact) => (
          <article key={fact.title} className="rounded-3xl border border-[#d5dbe3] bg-white p-6">
            <h2 className="text-xl font-semibold">{fact.title}</h2>
            <p className="mt-3 text-[#3c4550]">{fact.body}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl font-semibold tracking-tight">Browse by country</h2>
          <a href="/directory/countries" className="text-sm font-medium text-[#155eef]">
            All countries
          </a>
        </div>
        {countries.length > 0 ? (
          <ul className="mt-6 flex flex-wrap gap-2">
            {countries.slice(0, 12).map((country) => (
              <li key={country.slug}>
                <a
                  href={country.href}
                  className="inline-flex rounded-full border border-[#d5dbe3] bg-white px-3 py-1.5 text-sm hover:border-[#155eef]"
                >
                  {country.name} ({country.count})
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-[#3c4550]">
            The country list is on the countries page.
          </p>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl font-semibold tracking-tight">Browse by state</h2>
          <a href="/directory/states" className="text-sm font-medium text-[#155eef]">
            All states
          </a>
        </div>
        {states.length > 0 ? (
          <ul className="mt-6 flex flex-wrap gap-2">
            {states.slice(0, 12).map((state) => (
              <li key={state.slug}>
                <a
                  href={`/directory/${state.slug}`}
                  className="inline-flex rounded-full border border-[#d5dbe3] bg-white px-3 py-1.5 text-sm hover:border-[#155eef]"
                >
                  {state.name} ({state.count})
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-[#3c4550]">
            The state list is on the states page.
          </p>
        )}
      </section>

      <section className="mx-auto max-w-3xl px-4 py-8">
        <h2 className="text-3xl font-semibold tracking-tight">Questions</h2>
        <div className="mt-4 space-y-3">
          {questions.map((item) => (
            <details key={item.q} className="rounded-2xl border border-[#d5dbe3] bg-white px-5 py-4">
              <summary className="cursor-pointer font-medium">{item.q}</summary>
              <p className="mt-3 text-[#3c4550]">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#090b10] px-8 py-12 text-white">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,0.14)_50%,transparent_70%)]" />
          <div className="relative max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight">Own a video game store?</h2>
            <p className="mt-3 text-white/75">
              Send the shop name and the place details you have. Listings are reviewed before they go on the public site.
            </p>
            <a href="/submit" className="mt-6 inline-flex rounded-full bg-[#155eef] px-5 py-2.5 text-sm font-medium text-white">
              Submit a store
            </a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
