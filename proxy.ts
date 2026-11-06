import { NextResponse, type NextRequest } from "next/server";
import { directoryBasePath, isDirectoryListPath } from "@/lib/filters";
import { CANONICAL_HOST } from "@/lib/site";

function hasExtraFilters(url: URL): boolean {
  for (const key of url.searchParams.keys()) {
    if (key === "page") continue;
    if (url.searchParams.get(key)) return true;
  }
  return false;
}

/**
 * Runs before the page. One redirect fixes the host, capital letters, and the slash.
 * Filter addresses stay put and send a noindex header. Search engines do not
 * honor a robots tag that exists only in JavaScript.
 */
export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostHeader = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const hostname = hostHeader.split(",")[0]?.trim().split(":")[0]?.toLowerCase() ?? "";

  if (hostname === `www.${CANONICAL_HOST}`) {
    url.protocol = "https:";
    url.hostname = CANONICAL_HOST;
    url.port = "";
  }

  url.pathname = url.pathname.toLowerCase();
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  }

  if (isDirectoryListPath(url.pathname)) {
    const pageRaw = url.searchParams.get("page");
    if (pageRaw && !hasExtraFilters(url)) {
      const page = Number.parseInt(pageRaw, 10);
      url.searchParams.delete("page");
      const base = directoryBasePath(url.pathname);
      url.pathname = !Number.isInteger(page) || page <= 1 ? base : `${base}/page/${page}`;
    }
  }

  const dirty =
    url.protocol !== request.nextUrl.protocol ||
    url.hostname !== request.nextUrl.hostname ||
    url.port !== request.nextUrl.port ||
    url.pathname !== request.nextUrl.pathname ||
    url.search !== request.nextUrl.search;

  if (dirty) {
    const location =
      hostname === `www.${CANONICAL_HOST}`
        ? `https://${CANONICAL_HOST}${url.pathname}${url.search}`
        : `${url.pathname}${url.search}`;
    return NextResponse.redirect(new URL(location, request.url), 308);
  }

  if (isDirectoryListPath(url.pathname) && hasExtraFilters(url)) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, follow");
    return response;
  }

  const path = url.pathname;
  const isPrivate =
    path === "/admin" ||
    path.startsWith("/admin/") ||
    path === "/account" ||
    path.startsWith("/account/") ||
    path === "/dashboard" ||
    path.startsWith("/dashboard/") ||
    path === "/api" ||
    path.startsWith("/api/");

  if (isPrivate) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, follow");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
