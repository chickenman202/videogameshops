import { PageShell } from "@/components/page-shell";

/** Shared layout for about, contact, legal, and submit pages. */
export function ArticlePage({
  title,
  lede,
  children,
}: {
  title: string;
  lede?: string;
  children?: React.ReactNode;
}) {
  return (
    <PageShell>
      <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
        <p className="kicker text-signal">videogameshops</p>
        <h1 className="mt-3 text-5xl uppercase text-ink sm:text-7xl">{title}</h1>
        {lede ? <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">{lede}</p> : null}
        {children}
      </article>
    </PageShell>
  );
}
