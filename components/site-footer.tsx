import Link from "next/link";
import { Mark } from "@/components/mark";

const groups = [
  {
    title: "Directory",
    links: [
      { href: "/directory", label: "All stores" },
      { href: "/directory/states", label: "States" },
      { href: "/directory/platforms", label: "Platforms" },
    ],
  },
  {
    title: "Site",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/submit", label: "Submit a store" },
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
    <footer className="mt-auto bg-ink text-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.7fr)]">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 font-display text-xl font-semibold text-card">
            <Mark className="size-8" />
            videogameshops
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-paper">
            A directory of physical video game stores in the United States. Hours, addresses, and platforms come from
            public listings and from store owners.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="text-sm font-semibold text-paper">{group.title}</p>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                  <Link href={link.href} className="text-sm text-card underline-offset-4 hover:underline">
                    {link.label}
                  </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-sm text-paper">
          videogameshops lists physical video game stores in the United States.
        </p>
      </div>
    </footer>
  );
}
