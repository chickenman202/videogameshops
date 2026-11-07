import { CONTENT_SIGNAL } from "@/lib/discovery";
import { SITE_URL } from "@/lib/site";

export const revalidate = 86400;

export function GET() {
  const body = {
    linkset: [
      {
        anchor: `${SITE_URL}/api/shops`,
        "service-desc": [{ href: `${SITE_URL}/api/shops/openapi.json`, type: "application/json" }],
        "service-doc": [{ href: `${SITE_URL}/api/shops/docs`, type: "text/html" }],
        status: [{ href: `${SITE_URL}/api/shops/status`, type: "application/json" }],
      },
    ],
  };
  return Response.json(body, {
    headers: {
      "Content-Type": 'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
      "Content-Signal": CONTENT_SIGNAL,
      "Link": `<${SITE_URL}/.well-known/api-catalog>; rel="api-catalog"`,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
