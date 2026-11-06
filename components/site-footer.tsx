import Link from "next/link";
import { Mark } from "@/components/mark";

const groups = [
  {
    title: "Directory",
    links: [
      { href: "/directory", label: "All stores" },
      { href: "/#countries", label: "Countries" },
      { href: "/directory/states", label: "States" },
      { href: "/directory/platforms", label: "Platforms" },
    ],
  },
  {
    title: "Site",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/submit", label: "Add a store" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-stage text-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.6fr)]">
        <div>
          <Link href="/" className="inline-flex items-center gap-2">
            <Mark className="size-8 shrink-0" />
            <span className="font-display text-2xl font-bold uppercase">videogameshops</span>
          </Link>
          <p className="mt-4 max-w-sm font-serif text-base leading-relaxed text-paper/80">
            Video Game Shops lists physical stores by country, region, and city.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="kicker text-blue-mist">{group.title}</p>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="font-mono text-sm text-paper underline-offset-4 hover:underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/15">
        <p className="mx-auto max-w-6xl px-4 py-4 font-mono text-xs uppercase tracking-wider text-paper/70">
          Physical video game shops, worldwide.
        </p>
      </div>
    </footer>
  );
}
