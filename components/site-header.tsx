"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Mark } from "@/components/mark";

const links = [
  { href: "/directory", label: "Stores" },
  { href: "/directory/states", label: "States" },
  { href: "/directory/platforms", label: "Platforms" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2 font-display text-lg font-semibold tracking-tight text-ink">
          <Mark className="size-8 shrink-0" />
          <span className="truncate">videogameshops</span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-5 text-sm font-semibold text-ink-soft lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/submit" className="btn btn-primary hidden lg:inline-flex">
            Add a store
          </Link>
          <button
            ref={buttonRef}
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-xl border border-line bg-card text-ink lg:hidden"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
      {open ? (
        <nav id={menuId} aria-label="Mobile" className="border-t border-line px-4 py-3 lg:hidden">
          <ul className="space-y-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex min-h-11 items-center rounded-xl px-3 font-semibold text-ink hover:bg-paper-deep"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/submit" className="btn btn-primary mt-3 w-full lg:hidden">
            Add a store
          </Link>
        </nav>
      ) : null}
    </header>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}
