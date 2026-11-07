import { CONTENT_SIGNAL } from "@/lib/discovery";
import { SITE_URL } from "@/lib/site";

export const revalidate = 86400;

export function GET() {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>videogameshops shop search</title>
</head>
<body>
  <h1>Shop search</h1>
  <p>GET ${SITE_URL}/api/shops returns indexable physical video game stores.</p>
  <p>Query parameters: q (name, city, region, or country), country (ISO code, slug, or English name), and limit (1 to 50, default 20).</p>
  <p>Each shop includes name, city, region, country, and the public page URL. Phone numbers and street addresses are not in this response.</p>
  <p>Machine description: <a href="${SITE_URL}/api/shops/openapi.json">${SITE_URL}/api/shops/openapi.json</a></p>
</body>
</html>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Signal": CONTENT_SIGNAL,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
