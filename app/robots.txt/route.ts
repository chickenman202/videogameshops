import { CONTENT_SIGNAL, robotsTxt } from "@/lib/discovery";
import { SITE_URL } from "@/lib/site";

export const revalidate = 86400;

export function GET() {
  return new Response(robotsTxt(SITE_URL), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Signal": CONTENT_SIGNAL,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
