/** Content Signals: search and agent grounding yes, training no. https://contentsignals.org/ */
export const CONTENT_SIGNAL = "search=yes, ai-input=yes, ai-train=no";

export const SEARCH_BOTS = [
  "Googlebot",
  "Bingbot",
  "OAI-SearchBot",
  "PerplexityBot",
  "Claude-SearchBot",
  "Applebot",
  "ChatGPT-User",
  "Claude-User",
  "Perplexity-User",
] as const;

const PRIVATE_PATHS = ["/admin", "/admin/", "/account", "/account/", "/dashboard", "/dashboard/", "/api/", "/md", "/md/"];

/** Public markdown address for one HTML path. Home is /index.md. */
export function markdownPath(htmlPath: string): string {
  if (htmlPath === "/" || htmlPath === "") return "/index.md";
  return `${htmlPath}/index.md`;
}

/** Pull /index.md off a path. Other paths stay HTML. */
export function splitMarkdownSuffix(pathname: string): { htmlPath: string; isMarkdownUrl: boolean } {
  if (pathname === "/index.md") return { htmlPath: "/", isMarkdownUrl: true };
  if (pathname.endsWith("/index.md")) {
    const htmlPath = pathname.slice(0, -"/index.md".length) || "/";
    return { htmlPath, isMarkdownUrl: true };
  }
  return { htmlPath: pathname, isMarkdownUrl: false };
}

/** Internal rewrite target. The public URL stays the HTML path or /index.md. */
export function markdownInternalPath(htmlPath: string): string {
  return htmlPath === "/" ? "/md" : `/md${htmlPath}`;
}

/**
 * text/markdown is preferred when it is present and its q is the highest.
 * A tie with text/html follows document order, so a normal browser Accept stays HTML.
 */
export function prefersMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  const parts = accept
    .split(",")
    .map((piece) => {
      const [rawType, ...params] = piece.split(";").map((item) => item.trim());
      let q = 1;
      for (const param of params) {
        const [key, value] = param.split("=").map((item) => item.trim());
        if (key === "q") q = Number(value);
      }
      return { type: rawType.toLowerCase(), q: Number.isFinite(q) ? q : 0 };
    })
    .filter((part) => part.type);
  const markdown = parts.find((part) => part.type === "text/markdown");
  if (!markdown || markdown.q <= 0) return false;
  const best = Math.max(...parts.map((part) => part.q));
  if (markdown.q < best) return false;
  const html = parts.find((part) => part.type === "text/html");
  if (html && html.q === markdown.q) {
    return parts.findIndex((part) => part.type === "text/markdown") < parts.findIndex((part) => part.type === "text/html");
  }
  return true;
}

export function publicLinkHeader(htmlPath: string): string {
  return [
    `</sitemap.xml>; rel="sitemap"`,
    `<${markdownPath(htmlPath)}>; rel="alternate"; type="text/markdown"`,
    `</.well-known/api-catalog>; rel="api-catalog"`,
  ].join(", ");
}

export function applyDiscoveryHeaders(headers: Headers, htmlPath: string): void {
  headers.set("Content-Signal", CONTENT_SIGNAL);
  headers.set("Link", publicLinkHeader(htmlPath));
  const vary = headers.get("Vary");
  headers.set("Vary", vary ? `${vary}, Accept` : "Accept");
}

/** robots.txt body. Training bots are not named, so they follow the * group. */
export function robotsTxt(siteUrl: string): string {
  const rules = ["Allow: /", ...PRIVATE_PATHS.map((path) => `Disallow: ${path}`), "Allow: /api/shops"];
  const group = (agent: string) => [`User-agent: ${agent}`, `Content-Signal: ${CONTENT_SIGNAL}`, ...rules].join("\n");
  return [
    group("*"),
    "",
    ...SEARCH_BOTS.map((agent) => `${group(agent)}\n`),
    `Sitemap: ${siteUrl}/sitemap.xml`,
    `Host: ${siteUrl}`,
    "",
  ].join("\n");
}
