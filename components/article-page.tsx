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
        <h1 className="text-4xl text-balance text-ink sm:text-5xl">{title}</h1>
        {lede ? <p className="mt-4 text-lg leading-relaxed text-ink-soft">{lede}</p> : null}
        {children}
      </article>
    </PageShell>
  );
}
