import { NextResponse, type NextRequest } from "next/server";
import {
  applyDiscoveryHeaders,
  markdownInternalPath,
  markdownPath,
  prefersMarkdown,
  splitMarkdownSuffix,
} from "@/lib/discovery";
import { directoryBasePath, isDirectoryListPath } from "@/lib/filters";
import { canonicalDirectoryRedirect } from "@/lib/redirects";
import { CANONICAL_HOST } from "@/lib/site";

function hasExtraFilters(url: URL): boolean {
  for (const key of url.searchParams.keys()) {
    if (key === "page") continue;
    if (url.searchParams.get(key)) return true;
  }
  return false;
}

function isMachinePath(pathname: string): boolean {
  return (
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/llms.txt" ||
    pathname.startsWith("/.well-known") ||
    pathname === "/api" ||
    pathname.startsWith("/api/") ||
    pathname === "/mcp" ||
    pathname.startsWith("/mcp/") ||
    pathname === "/md" ||
    pathname.startsWith("/md/")
  );
}

function isPrivate(pathname: string): boolean {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/account" ||
    pathname.startsWith("/account/") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/api" ||
    pathname.startsWith("/api/")
  );
}

/**
 * Runs before the page. One redirect fixes the host, capital letters, and the slash.
 * Country aliases 308 to the ISO path. Accept: text/markdown and /index.md serve markdown.
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

  const requested = splitMarkdownSuffix(url.pathname);
  url.pathname = requested.htmlPath;

  if (isDirectoryListPath(url.pathname)) {
    const pageRaw = url.searchParams.get("page");
    if (pageRaw && !hasExtraFilters(url)) {
      const page = Number.parseInt(pageRaw, 10);
      url.searchParams.delete("page");
      const base = directoryBasePath(url.pathname);
      url.pathname = !Number.isInteger(page) || page <= 1 ? base : `${base}/page/${page}`;
    }
  }

  const alias = canonicalDirectoryRedirect(url.pathname);
  if (alias) url.pathname = alias;

  const canonicalPath = requested.isMarkdownUrl ? markdownPath(url.pathname) : url.pathname;
  const dirty =
    url.protocol !== request.nextUrl.protocol ||
    url.hostname !== request.nextUrl.hostname ||
    url.port !== request.nextUrl.port ||
    canonicalPath !== request.nextUrl.pathname ||
    url.search !== request.nextUrl.search;

  if (dirty) {
    const location =
      hostname === `www.${CANONICAL_HOST}`
        ? `https://${CANONICAL_HOST}${canonicalPath}${url.search}`
        : `${canonicalPath}${url.search}`;
    return NextResponse.redirect(new URL(location, request.url), 308);
  }

  const wantsMarkdown =
    (requested.isMarkdownUrl || prefersMarkdown(request.headers.get("accept"))) &&
    !isMachinePath(url.pathname);
  if (wantsMarkdown) {
    const rewritten = url.clone();
    rewritten.pathname = markdownInternalPath(url.pathname);
    return NextResponse.rewrite(rewritten);
  }

  const response = NextResponse.next();
  if (isDirectoryListPath(url.pathname) && hasExtraFilters(url)) {
    response.headers.set("X-Robots-Tag", "noindex, follow");
  } else if (isPrivate(url.pathname)) {
    response.headers.set("X-Robots-Tag", "noindex, follow");
  }
  if (!isPrivate(url.pathname) && !isMachinePath(url.pathname)) {
    applyDiscoveryHeaders(response.headers, url.pathname);
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
