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
      <div className="mx-auto w-full max-w-xl px-4 py-16 sm:py-24">
        <div className="rounded-3xl border border-line bg-card p-6 shadow-card sm:p-8">
          <p className="text-sm font-bold text-clay">{kicker}</p>
          <h1 className="mt-2 text-4xl text-balance text-ink">{title}</h1>
          <p className="mt-3 text-lg leading-relaxed text-ink-soft">{body}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
      </div>
    </PageShell>
  );
}
