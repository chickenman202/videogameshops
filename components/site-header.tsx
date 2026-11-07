const links = [
  { href: "/directory", label: "Stores" },
  { href: "/directory/states", label: "States" },
  { href: "/directory/countries", label: "Countries" },
  { href: "/directory/platforms", label: "Platforms" },
  { href: "/about", label: "About" },
];

export function SiteHeader({ tone }: { tone: "solid" | "hero" }) {
  const bar =
    tone === "hero"
      ? "border border-white/15 bg-white/95 text-[#090b10] shadow-[0_10px_40px_rgba(0,0,0,0.18)]"
      : "border-b border-[#d5dbe3] bg-white/90 text-[#090b10] backdrop-blur";

  return (
    <header className={tone === "solid" ? `sticky top-0 z-20 ${bar}` : ""}>
      <div className={tone === "hero" ? `mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-full px-3 py-2 ${bar}` : "mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3"}>
        <a href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#155eef] text-white" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_0_3px_rgba(255,255,255,0.35)]" />
          </span>
          videogameshops
        </a>
        <nav aria-label="Main" className="hidden items-center gap-5 text-sm text-[#3c4550] md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-[#090b10]">
              {link.label}
            </a>
          ))}
        </nav>
        <a
          href="/submit"
          className="rounded-full bg-[#155eef] px-4 py-2 text-sm font-medium text-white hover:bg-[#0f4ed0]"
        >
          Add a store
        </a>
      </div>
      <nav aria-label="Mobile" className={tone === "hero" ? "mx-auto flex max-w-6xl gap-4 overflow-x-auto px-1 py-3 text-sm text-white/80 md:hidden" : "mx-auto flex max-w-6xl gap-4 overflow-x-auto px-4 py-2 text-sm text-[#3c4550] md:hidden"}>
        {links.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
