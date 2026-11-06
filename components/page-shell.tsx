import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function PageShell({
  children,
  header = "solid",
}: {
  children: React.ReactNode;
  header?: "solid" | "none";
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {header === "solid" ? <SiteHeader tone="solid" /> : null}
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
