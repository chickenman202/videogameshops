import { getPlatformByLabel, getPlatformBySlug, type PlatformLabel } from "./platforms";

export type Filters = {
  q: string;
  sellsNew: boolean;
  sellsUsed: boolean;
  tradeIns: boolean;
  repairs: boolean;
  platform: PlatformLabel | null;
};

export function emptyFilters(): Filters {
  return {
    q: "",
    sellsNew: false,
    sellsUsed: false,
    tradeIns: false,
    repairs: false,
    platform: null,
  };
}

function one(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function filtersFromRecord(
  record: Record<string, string | string[] | undefined>,
): Filters {
  const platformRaw = one(record.platform).trim();
  const platform = platformRaw
    ? (getPlatformBySlug(platformRaw) ?? getPlatformByLabel(platformRaw))
    : null;
  return {
    q: one(record.q).trim(),
    sellsNew: one(record.new) === "1",
    sellsUsed: one(record.used) === "1",
    tradeIns: one(record.trade) === "1",
    repairs: one(record.repair) === "1",
    platform: platform?.label ?? null,
  };
}

export function recordHasFilters(
  record: Record<string, string | string[] | undefined>,
): boolean {
  return Object.entries(record).some(([key, value]) => {
    if (key === "page") return false;
    return one(value).trim() !== "";
  });
}

export function hasFilters(filters: Filters): boolean {
  return Boolean(
    filters.q ||
      filters.sellsNew ||
      filters.sellsUsed ||
      filters.tradeIns ||
      filters.repairs ||
      filters.platform,
  );
}

export function filterSearchParams(filters: Filters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.sellsNew) params.set("new", "1");
  if (filters.sellsUsed) params.set("used", "1");
  if (filters.tradeIns) params.set("trade", "1");
  if (filters.repairs) params.set("repair", "1");
  if (filters.platform) {
    const platform = getPlatformByLabel(filters.platform);
    if (platform) params.set("platform", platform.slug);
  }
  return params;
}

export function hrefWithFilters(path: string, filters: Filters): string {
  const query = filterSearchParams(filters).toString();
  return query ? `${path}?${query}` : path;
}

/**
 * Store lists can use ?page= and filter queries.
 * Country and state hubs are not lists, so a page query is not rewritten onto them.
 */
export function isDirectoryListPath(pathname: string): boolean {
  if (pathname === "/directory") return true;
  if (!pathname.startsWith("/directory/")) return false;
  if (pathname === "/directory/states" || pathname.startsWith("/directory/states/")) return false;
  if (pathname === "/directory/countries") return false;
  const parts = pathname.split("/").filter(Boolean);
  if (parts[1] === "countries" && parts.length === 3) return false;
  return true;
}

export function directoryBasePath(pathname: string): string {
  return pathname.replace(/\/page\/\d+$/, "") || "/directory";
}
