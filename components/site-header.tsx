"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Mark } from "@/components/mark";

const links = [
  { href: "/directory", label: "Stores" },
  { href: "/#countries", label: "Countries" },
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
    <header className="sticky top-0 z-30 border-b border-white/15 bg-stage text-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <Mark className="size-7 shrink-0" />
          <span className="truncate font-display text-2xl font-bold uppercase tracking-tight">videogameshops</span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-5 lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="kicker text-silver hover:text-blue-mist">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/submit" className="btn btn-light hidden lg:inline-flex">
            Add a store
          </Link>
          <button
            ref={buttonRef}
            type="button"
            className="inline-flex size-11 items-center justify-center border border-white/30 text-paper lg:hidden"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
      <nav id={menuId} aria-label="Mobile" hidden={!open} className="border-t border-white/15 px-4 py-3 lg:hidden">
        <ul className="space-y-1">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="flex min-h-12 items-center font-display text-3xl font-bold uppercase tracking-tight"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/submit" className="btn btn-light mt-3 w-full">
          Add a store
        </Link>
      </nav>
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
