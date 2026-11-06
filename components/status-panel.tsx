import Link from "next/link";
import { PageShell } from "@/components/page-shell";

type Action = { href: string; label: string; tone?: "primary" | "ghost" };

export function StatusPanel({
  kicker = "Directory",
  title,
  body,
  actions,
  children,
}: {
  kicker?: string;
  title: string;
  body: string;
  actions: Action[];
  children?: React.ReactNode;
}) {
  return (
    <PageShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:py-24">
        <p className="kicker text-blue">{kicker}</p>
        <h1 className="mt-3 max-w-2xl text-5xl uppercase text-ink sm:text-7xl">{title}</h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">{body}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {children}
          {actions.map((action) => (
            <Link
              key={action.href + action.label}
              href={action.href}
              className={action.tone === "ghost" ? "btn btn-ghost" : "btn btn-primary"}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
