import { loadCatalog } from "@/lib/catalog";
import { CONTENT_SIGNAL } from "@/lib/discovery";
import { searchPublicShops } from "@/lib/shops-api";

export const revalidate = 86400;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const catalog = await loadCatalog();
  if (!catalog.ok) {
    return Response.json({ error: "The store list could not be loaded." }, { status: 503 });
  }
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const shops = searchPublicShops(catalog.stores, {
    q: url.searchParams.get("q") ?? "",
    country: url.searchParams.get("country") ?? "",
    limit: Number.isFinite(limit) ? limit : 20,
  });
  return Response.json(
    { shops },
    {
      headers: {
        "Content-Signal": CONTENT_SIGNAL,
        "Cache-Control": "public, max-age=86400",
        "X-Robots-Tag": "noindex, follow",
      },
    },
  );
}
