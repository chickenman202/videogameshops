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
    <footer className="mt-auto border-t border-white/10 bg-[#090b10] text-[#d5dbe3]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8b95a3]">{group.title}</p>
            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-sm text-white hover:text-[#d5dbe3]">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-sm text-[#8b95a3]">
          Shop locations include data from OpenStreetMap contributors, Game-Route, Wikidata, and Dallas Retro
          Gamers.
        </p>
      </div>
    </footer>
  );
}
